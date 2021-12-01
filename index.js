#!/usr/bin/env node

const { argv } = require('yargs')
const fs = require('fs')
const uuid = require('uuid/v4')
const filenamify = require('filenamify')

const GitApi = require('./git-api')
const ClocApi = require('./cloc-api')
const ComplexityCalculator = require('./complexity-calculator')

setImmediate(() => main())

async function main () {
  try {
    const git = new GitApi(argv.tab)

    let files = []
    if (argv._ && argv._.length > 0) {
      files.push(...argv._)
    } else {
      files = await git.lsFiles()
    }

    if (files.length === 0) {
      exit('No files to process')
    }

    const cloc = new ClocApi()
    const filesComplexity = await getFilesComplexity(files, git, cloc)

    printCsv(filesComplexity)
  } catch (error) {
    exit(error.message)
  }
}

async function getFilesComplexity (files, git, cloc) {
  const filesComplexity = await Promise.all(files.map(async (file) => {
    const fileRevisions = await git.log(file)
    if (!fileRevisions) { return }

    const revisionsComplexity = await Promise.all(
      fileRevisions.map(async (fileRevision) => getRevisionComplexity(fileRevision, git, cloc)))

    return {
      fileName: file,
      revisions: revisionsComplexity.filter((revisionComplexity) => typeof revisionComplexity !== 'undefined')
    }
  }))

  return filesComplexity.filter((fileComplexity) => typeof fileComplexity !== 'undefined')
}

async function getRevisionComplexity (fileRevision, git, cloc) {
  const revisionBlobHash = await git.lsTree(fileRevision.gitHash, fileRevision.fileName)
  if(!revisionBlobHash) return
  
  const catFileCommand = git.catFile(revisionBlobHash)
  const fileName = await writeRevisionFile(catFileCommand.stdout, fileRevision.fileName)
  const linesOfCode = await cloc.countLines(fileName)
  removeRevisionFile(fileName)
  const revisionComplexity = await git.whitespaceComplexity(revisionBlobHash)
  return {
    date: fileRevision.authorDate,
    complexity: revisionComplexity,
    linesOfCode
  }
}

function removeRevisionFile (filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err)
    }
  })
}

async function writeRevisionFile (stream, originalPathFileName) {
  return new Promise((resolve, reject) => {
    const originalFileName = filenamify(originalPathFileName, { replacement: '_' })
    const fileName = `rev_${uuid()}_${originalFileName}`
    const writeStream = fs.createWriteStream(fileName, { encoding: 'utf-8', flags: 'a' })
    stream.pipe(writeStream)
    writeStream.on('finish', () => {
      resolve(fileName)
    })
  })
}

function printCsv (filesComplexity) {
  if (!filesComplexity || filesComplexity.length === 0) {
    exit('No data available')
  }

  console.log('file,date,complexity,lines')

  filesComplexity.forEach((entry) => {
    if (!entry.revisions.length > 0) { return }

    entry.revisions.forEach((revision) => {
      console.log(`${entry.fileName},${revision.date},${revision.complexity},${revision.linesOfCode}`)
    })
  })
}

function exit (errorMessage) {
  console.log(errorMessage)
  process.exit(0)
}
