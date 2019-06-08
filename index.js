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

const ls = spawn('git', ['log', '--pretty=%H', '--', fileName])
ls.stdout.setEncoding('utf8')
const rl = readline.createInterface({ input: ls.stdout })
const complexityCalculator = new ConplexityCalculator(tabLength)

rl.on('line', async (gitHash) => {
  try {
    const fileRevisionBlobs = await getFileRevisionBlobs(gitHash, fileName)
    for (const blob of fileRevisionBlobs) {
      const complexity = await getBlobComplexity(blob)
      console.log(`complexity of ${blob}: ${complexity}`)
    }
  } catch (error) {
    console.log(error)
  }
})

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`)
})

async function getFileRevisionBlobs (gitHash, fileName) {
  return new Promise((resolve, reject) => {
    const blobs = []
    const lsTree = spawn('git', ['ls-tree', gitHash, '--', fileName])
    lsTree.stdout.setEncoding('utf8')
    lsTree.stderr.setEncoding('utf8')

    const lsTreeReadline = readline.createInterface({ input: lsTree.stdout })

    const regexFilter = /(blob\s.+)(\s)/
    lsTreeReadline.on('line', (data) => {
      const match = regexFilter.exec(data)
      const blobHash = match[1].split(' ')[1]
      blobs.push(blobHash)
    })

    lsTreeReadline.on('close', () => {
      resolve(blobs)
    })

    lsTree.stderr.on('data', (error) => {
      reject(error)
    })
  })
}

async function getBlobComplexity (blobHash) {
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
