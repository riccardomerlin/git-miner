const { spawn } = require('child_process')
const readline = require('readline')
const ComplexityCalculator = require('./complexity-calculator')

class GitApi {
  constructor (tabLength) {
    this._complexityCalculator = new ComplexityCalculator(tabLength)
  }

  catFile (blobHash) {
    const command = spawn('git', ['cat-file', 'blob', blobHash])
    command.stdout.setEncoding('utf8')
    command.stderr.setEncoding('utf8')
    return command
  }

  log (file) {
    return this._runCommand(['log', '--pretty=format:%H %aI', '--', file], this._parseGitLog, [file])
  }

  lsFiles (gitHash, fileName) {
    return this._runCommand(['ls-files'], this._parseGitLsFiles)
  }

  lsTree (gitHash, fileName) {
    return this._runCommand(['ls-tree', gitHash, '--', fileName], this._parseGitLsTree)
  }

  whitespaceComplexity (blobHash) {
    return this._runCommand(['cat-file', 'blob', blobHash], this._getWhitespaceComplexity.bind(this))
  }

  _runCommand (args, action, actionArgs = []) {
    return new Promise((resolve, reject) => {
      let result
      const command = spawn('git', args)
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

  _getWhitespaceComplexity (line, complexity) {
    if (!complexity) { complexity = 0 }

    complexity += this._complexityCalculator.whiteSpaceComplexity(line)
    return complexity
  }

  _parseGitLog (line, results, fileName) {
    const lineParts = line.split(' ')
    const gitHash = lineParts[0]
    const authorDate = /\d{4}-\d{2}-\d{2}/.exec(lineParts[1])[0]
    if (!results) { results = [] }

    results.push({ fileName, authorDate, gitHash })
    return results
  }

  _parseGitLsTree (line) {
    const regexFilter = /(blob\s.+)(\s)/
    const match = regexFilter.exec(line)
    return match[1].split(' ')[1]
  }

  _parseGitLsFiles (file, results) {
    if (!results) { results = [] }

    results.push(file)
    return results
  }
}

module.exports = GitApi
