#!/usr/bin/env node

const { argv } = require('yargs')

const GitApi = require('./git-api')

setImmediate(() => main())

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

  const collection = await Promise.all(files.map(async (file) => {
    try {
      const fileRevisionDateHashes = await git.log(file)
      if (!fileRevisionDateHashes) { throw new Error(`No git log for "${file}"`) }

      const revisions = await Promise.all(fileRevisionDateHashes.map(async (entry) => {
        const blobHash = await git.lsTree(entry.gitHash, entry.fileName)
        const complexity = await git.whitespaceComplexity(blobHash)

        return `${entry.fileName},${entry.authorDate},${complexity}`
      }))

      return revisions
    } catch (error) {
      exit(error.message)
    }
  }))

  console.log('file,date,complexity')

  collection.forEach((entry) => {
    if (Array.isArray(entry)) {
      entry.forEach((item) => console.log(item))
    } else {
      console.log(entry)
    }
  })
}

function exit (errorMessage) {
  console.log(errorMessage)
  process.exit(0)
}
