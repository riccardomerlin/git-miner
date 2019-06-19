#!/usr/bin/env node

const { argv } = require('yargs')

const GitApi = require('./git-api')

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

    const collection = await Promise.all(files.map(async (file) => {
      const fileRevisions = await git.log(file)
      if (!fileRevisions) { return }

      const revisionsComplexity = await getRevisionsComplexity(fileRevisions, git)

      return {
        fileName: file,
        revisions: revisionsComplexity
      }
    }))

    printCsv(collection.filter((value) => typeof value !== 'undefined'))
  } catch (error) {
    exit(error.message)
  }
}

async function getRevisionsComplexity (fileRevisions, git) {
  return Promise.all(fileRevisions.map(async (fileRevision) => {
    const revisionBlobHash = await git.lsTree(fileRevision.gitHash, fileRevision.fileName)
    const revisionComplexity = await git.whitespaceComplexity(revisionBlobHash)
    return {
      date: fileRevision.authorDate,
      complexity: revisionComplexity
    }
  }))
}

function printCsv (collection) {
  if (!collection || collection.length === 0) {
    exit('No data available')
  }

  console.log('file,date,complexity')

  collection.forEach((entry) => {
    if (!entry.revisions.length > 0) { return }

    entry.revisions.forEach((revision) => {
      console.log(`${entry.fileName},${revision.date},${revision.complexity}`)
    })
  })
}

function exit (errorMessage) {
  console.log(errorMessage)
  process.exit(0)
}
