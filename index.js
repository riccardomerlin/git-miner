#!/usr/bin/env node

const { spawn } = require('child_process')
const readline = require('readline')
const { argv } = require('yargs')

const ConplexityCalculator = require('./complexity-calculator')

if (!argv.file) {
  process.stdout.write('--file argument missing\n')
  process.exit()
}
const fileName = argv.file
const tabLength = argv.tab

const gitLog = spawn('git', [
  'log',
  '--pretty=format:%H %aI',
  '--',
  fileName])

gitLog.stdout.setEncoding('utf8')
gitLog.stderr.setEncoding('utf8')
const rl = readline.createInterface({ input: gitLog.stdout })
const complexityCalculator = new ConplexityCalculator(tabLength)
console.log('date,complexity')

rl.on('line', async (line) => {
  try {
    const lineParts = line.split(' ')
    const gitHash = lineParts[0]
    const authorDate = /\d{4}-\d{2}-\d{2}/.exec(lineParts[1])
    const blobHash = await getFileRevisionBlobHash(gitHash, fileName)
    if (!blobHash) { return }

    const complexity = await getFileComplexity(blobHash)

    console.log(`${authorDate},${complexity}`)
  } catch (error) {
    console.log(error)
  }
})

gitLog.stderr.on('data', (data) => {
  console.log(data)
})

async function getFileRevisionBlobHash (gitHash, fileName) {
  return new Promise((resolve, reject) => {
    let blobHash
    const lsTree = spawn('git', ['ls-tree', gitHash, '--', fileName])
    lsTree.stdout.setEncoding('utf8')
    lsTree.stderr.setEncoding('utf8')

    const lsTreeReadline = readline.createInterface({ input: lsTree.stdout })

    const regexFilter = /(blob\s.+)(\s)/
    lsTreeReadline.on('line', (data) => {
      const match = regexFilter.exec(data)
      blobHash = match[1].split(' ')[1]
    })

    lsTreeReadline.on('close', () => {
      resolve(blobHash)
    })

    lsTree.stderr.on('data', (error) => {
      reject(error)
    })
  })
}

async function getFileComplexity (blobHash) {
  return new Promise((resolve, reject) => {
    let complexity = 0
    const catFile = spawn('git', ['cat-file', 'blob', blobHash])
    catFile.stdout.setEncoding('utf8')
    catFile.stderr.setEncoding('utf8')

    const catfileReadline = readline.createInterface({ input: catFile.stdout })
    catfileReadline.on('line', (line) => {
      complexity += complexityCalculator.whiteSpaceComplexity(line)
    })

    catfileReadline.on('close', () => {
      resolve(complexity)
    })

    catFile.stderr.on('data', (error) => {
      reject(error)
    })
  })
}
