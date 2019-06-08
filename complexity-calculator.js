class ComplexityCalculator {
  constructor (tabLength) {
    this._tabLength = tabLength || 2
  }

  whiteSpaceComplexity (line) {
    const emptyLine = /^\s*$/
    const isEmptyLine = emptyLine.exec(line)
    if (isEmptyLine) {
      return 0
    }

    const leadingSpacesRegex = /^(\s+)/
    const matchingSpaces = leadingSpacesRegex.exec(line)
    const leadingSpaces = matchingSpaces ? matchingSpaces[1].length : 0

    const leadingTabsRegex = /^(\t+)/
    const matchingLeadingTabs = leadingTabsRegex.exec(line)
    const leadingTabs = matchingLeadingTabs ? matchingLeadingTabs.length : 0

    return Math.floor((leadingSpaces + leadingTabs) / this._tabLength)
  }
}

module.exports = ComplexityCalculator
