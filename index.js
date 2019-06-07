#!/usr/bin/env node

const { spawn } = require('child_process')
const readline = require('readline')

const fileName = 'Kneat.Gx.Web.App/JSX/app/SearchResults.app.jsx'
const ls = spawn('git', ['log', '--pretty=%H', '--', fileName])
ls.stdout.setEncoding('utf8')
const rl = readline.createInterface({ input: ls.stdout })

rl.on('line', async (gitHash) => {
   try {
      const fileRevisionBlobs = await getFileRevisionBlobs(gitHash, fileName)
      for (const blob of fileRevisionBlobs) {
         console.log(blob)
         //const content = await getBlobContent(blob);
      }
   } catch (error) {
      console.log(error)
   }
})

ls.stderr.on('data', (data) => {
   console.log(`stderr: ${data}`)
});

async function getFileRevisionBlobs(gitHash, fileName) {
   return new Promise((resolve, reject) => {
      const blobs = []
      const lsTree = spawn('git', ['ls-tree', gitHash, '--', fileName])
      lsTree.stdout.setEncoding('utf8')
      lsTree.stderr.setEncoding('utf8')
   
      const lsTreeReadline = readline.createInterface({ input: lsTree.stdout })
   
      const regexFilter = /(blob\s.+)(\s)/
      lsTreeReadline.on('line', async (data) => {
         const match = regexFilter.exec(data)
         blobs.push(match[1])
         //console.log(match[1])
      })
   
      lsTreeReadline.on('close', () => {
         resolve(blobs)
      })

      lsTree.stderr.on('data', (error) => {
         reject(error)
      })
   })
}