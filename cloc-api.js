const { spawn } = require('child_process')
const readline = require('readline')

class ClocApi {
  countLines (fileName) {
    return new Promise((resolve, reject) => {
      const cloc = spawn('cloc', [fileName, '--csv', '--quiet', '--hide-rate'])
      cloc.stdout.setEncoding('utf-8')
      cloc.stderr.setEncoding('utf-8')
      const rl = readline.createInterface({ input: cloc.stdout })

      cloc.stderr.on('error', (error) => reject(error))

      let isFirstRow = true
      let result
      rl.on('line', (line) => {
        if (isFirstRow) {
          isFirstRow = false
          return
        }

        const values = line.split(',')
        result = values[values.length - 1]
      })

      rl.on('close', () => resolve(result))
    })
  }
}
module.exports = ClocApi
