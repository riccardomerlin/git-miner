/* global describe, it, beforeEach, expect */
const ComplexityCalculator = require('./complexity-calculator')

describe('complexity calculator tests', () => {
  describe('whitespace complexity', () => {
    let calculator
    beforeEach(() => {
      calculator = new ComplexityCalculator(2)
    })

    it('should return 0 when no whitespaces', () => {
      const result = calculator.whiteSpaceComplexity('nospacesarepresent')
      expect(result).toBe(0)
    })

    it('should return 0 when 1 spaces is present', () => {
      const result = calculator.whiteSpaceComplexity(' 1space')
      expect(result).toBe(0)
    })

    it('should return 1 when 2 spaces are present', () => {
      const result = calculator.whiteSpaceComplexity('  2paces')
      expect(result).toBe(1)
    })

    it('should return 1 when 3 spaces are present', () => {
      const result = calculator.whiteSpaceComplexity('   3spaces')
      expect(result).toBe(1)
    })

    it('should return 2 when 4 spaces are present', () => {
      const result = calculator.whiteSpaceComplexity('    4spaces')
      expect(result).toBe(2)
    })

    it('should return 0 when no text after spaces', () => {
      const result = calculator.whiteSpaceComplexity('  ')
      expect(result).toBe(0)
    })

    it('should return 0 when empty string', () => {
      const result = calculator.whiteSpaceComplexity('')
      expect(result).toBe(0)
    })

    it('should return 0 when spaces in the middle', () => {
      const result = calculator.whiteSpaceComplexity('spaces in the middle ')
      expect(result).toBe(0)
    })

    it('should return 1 when 1 tab is present', () => {
      const result = calculator.whiteSpaceComplexity('\t1tab')
      expect(result).toBe(1)
    })

    it('should return 2 when 2 tabs are present', () => {
      const result = calculator.whiteSpaceComplexity('\t\t2tabs')
      expect(result).toBe(2)
    })

    it('should return 2 when 2 space and 2 tab are present', () => {
      const result = calculator.whiteSpaceComplexity('  \t\t2spacesAnd2tabs')
      expect(result).toBe(2)
    })

    it('should return 1 when 1 tab at beginning and 1 in the middle are present', () => {
      const result = calculator.whiteSpaceComplexity('\t1tabInFront1tabInThe\tmiddle')
      expect(result).toBe(1)
    })

    it('should return 0 when tabs in the middle are present', () => {
      const result = calculator.whiteSpaceComplexity('tabs\tin\tthe\tmiddle\t')
      expect(result).toBe(0)
    })

    it('should return 0 when no text after tab', () => {
      const result = calculator.whiteSpaceComplexity('\t')
      expect(result).toBe(0)
    })

    it('should set tabLength 2 when no value passed to the constructor', () => {
      const calc = new ComplexityCalculator()
      expect(calc._tabLength).toBe(2)
    })
  })
})
