const util = require('util')
const exec = util.promisify(require('child_process').exec)

class ClocApi {
  async countLines (fileName) {
    const { stdout, stderr } = await exec(`cloc ${fileName} --csv --quiet --hide-rate`)
    if (stderr) {
      console.error(stderr)
    }
    const re = /^\d+.*$/img
    const match = re.exec(stdout)
    if (!match) { return 0 }

    const parts = match[0].split(',')
    return parts[parts.length - 1]
  }
}
module.exports = ClocApi
