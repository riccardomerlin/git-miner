#!/usr/bin/env node

const { argv } = require('yargs')

const GitApi = require('./git-api')

main()

async function main () {
  const git = new GitApi(argv.tab)

  let files = []
  if (argv._ && argv._.length > 0) {
    files.push(...argv._)
  } else {
    try {
      files = await git.lsFiles()
    } catch (error) {
      exit(error.message)
    }
  }

  if (files.length === 0) {
    exit('No files to process')
  }

  console.log('file,date,complexity')

  files.map(async (file) => {
    try {
      const fileRevisionDateHashes = await git.log(file)
      fileRevisionDateHashes.map(async (entry) => {
        const blobHash = await git.lsTree(entry.gitHash, entry.fileName)
        const complexity = await git.whitespaceComplexity(blobHash)

        console.log(`${entry.fileName},${entry.authorDate},${complexity}`)
      })
    } catch (error) {
      exit(error.message)
    }
  })
}

function exit (errorMessage) {
  console.log(errorMessage)
  process.exit(0)
}
