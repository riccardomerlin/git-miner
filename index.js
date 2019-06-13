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
    files = await runCommand('git', ['ls-files'], parseGitLsFiles)
  }

  if (files.length === 0) {
    console.log('No files to process')
    process.exit(0)
  }

  console.log('file,date,complexity')

  files.map(async (file) => {
    const fileRevisionDateHashes =
      await runCommand('git', ['log', '--pretty=format:%H %aI', '--', file], parseGitLogAction, [file])

    fileRevisionDateHashes.map(async (entry) => {
      const blobHash = await runCommand('git', ['ls-tree', entry.gitHash, '--', entry.fileName], parseGitLsTree)
      const complexity = await runCommand('git', ['cat-file', 'blob', blobHash], getWhitespaceComplexity)

      console.log(`${entry.fileName},${entry.authorDate},${complexity}`)
    })
  })
}

async function runCommand (name, args, action, actionArgs = []) {
  return new Promise((resolve, reject) => {
    let result
    const command = spawn(name, args)
    command.stdout.setEncoding('utf8')
    command.stderr.setEncoding('utf8')

    command.stderr.on('data', (data) => reject(data))

    const rl = readline.createInterface({ input: command.stdout })
    rl.on('close', () => resolve(result))

    rl.on('line', (line) => {
      result = action(line, result, ...actionArgs)
    })
  })
}

function parseGitLogAction (line, results, fileName) {
  const lineParts = line.split(' ')
  const gitHash = lineParts[0]
  const authorDate = /\d{4}-\d{2}-\d{2}/.exec(lineParts[1])[0]
  if (!results) { results = [] }

  results.push({ fileName, authorDate, gitHash })
  return results
}

function parseGitLsFiles (file, results) {
  if (!results) { results = [] }

  results.push(file)
  return results
}

function parseGitLsTree (line) {
  const regexFilter = /(blob\s.+)(\s)/
  const match = regexFilter.exec(line)
  return match[1].split(' ')[1]
}

function getWhitespaceComplexity (line, complexity) {
  if (!complexity) { complexity = 0 }

  complexity += complexityCalculator.whiteSpaceComplexity(line)
  return complexity
}
