#!/usr/bin/env node

const { spawn } = require('child_process')
const readline = require('readline')
const { argv } = require('yargs')
const ComplexityCalculator = require('./complexity-calculator')

const tabLength = argv.tab
const complexityCalculator = new ComplexityCalculator(tabLength)

main()

async function main () {
  let files = []
  if (argv._ && argv._.length > 0) {
    files.push(...argv._)
  } else {
    files = await gitLsFileNames()
  }

  if (files.length === 0) {
    console.log('No files to process')
    process.exit(0)
  }

  printAsCsv()
}

async function printAsCsv (files) {
  console.log('file,date,complexity')

  files.map(async (file) => {
    const fileRevisionDateHashes = await gitLogDateHash(file)
    fileRevisionDateHashes.map(async (entry) => {
      const blobHash = await getFileRevisionBlobHash(entry.gitHash, entry.fileName)
      const complexity = await getWhitespaceComplexity(blobHash)
      console.log(`${entry.fileName},${entry.authorDate},${complexity}`)
    })
  })
}

async function gitLsFileNames () {
  return new Promise((resolve, reject) => {
    const files = []

    const gitLsFiles = spawn('git', ['ls-files'])
    gitLsFiles.stdout.setEncoding('utf8')
    gitLsFiles.stderr.setEncoding('utf8')

    gitLsFiles.stderr.on('data', (data) => reject(data))

    const gitLsFilesReadline = readline.createInterface({ input: gitLsFiles.stdout })

    gitLsFilesReadline.on('line', (file) => {
      files.push(file)
    })

    gitLsFilesReadline.on('close', () => resolve(files))
  })
}

async function gitLogDateHash (fileName) {
  return new Promise(async (resolve, reject) => {
    const gitLog = spawn('git', [
      'log',
      '--pretty=format:%H %aI',
      '--',
      fileName])

    gitLog.stdout.setEncoding('utf8')
    gitLog.stderr.setEncoding('utf8')

    gitLog.stderr.on('data', (data) => {
      reject(data)
    })

    const dateHash = []
    const rl = readline.createInterface({ input: gitLog.stdout })
    rl.on('line', (line) => {
      const lineParts = line.split(' ')
      const gitHash = lineParts[0]
      const authorDate = /\d{4}-\d{2}-\d{2}/.exec(lineParts[1])[0]
      dateHash.push({ fileName, authorDate, gitHash })
    })

    rl.on('close', () => {
      resolve(dateHash)
    })
  })
}

async function getFileRevisionBlobHash (gitHash, fileName) {
  return new Promise((resolve, reject) => {
    let blobHash
    const lsTree = spawn('git', ['ls-tree', gitHash, '--', fileName])
    lsTree.stdout.setEncoding('utf8')
    lsTree.stderr.setEncoding('utf8')

    lsTree.stderr.on('data', (error) => {
      reject(error)
    })

    const rl = readline.createInterface({ input: lsTree.stdout })

    const regexFilter = /(blob\s.+)(\s)/
    rl.on('line', (data) => {
      const match = regexFilter.exec(data)
      blobHash = match[1].split(' ')[1]
    })

    rl.on('close', () => {
      resolve(blobHash)
    })
  })
}

async function getWhitespaceComplexity (blobHash) {
  return new Promise((resolve, reject) => {
    let complexity = 0
    const catFile = spawn('git', ['cat-file', 'blob', blobHash])
    catFile.stdout.setEncoding('utf8')
    catFile.stderr.setEncoding('utf8')

    catFile.stderr.on('data', (error) => {
      reject(error)
    })

    const rl = readline.createInterface({ input: catFile.stdout })
    rl.on('line', (line) => {
      complexity += complexityCalculator.whiteSpaceComplexity(line)
    })

    rl.on('close', () => {
      resolve(complexity)
    })
  })
}
