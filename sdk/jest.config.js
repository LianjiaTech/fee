// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    '<rootDir>/test/',
    '<rootDir>/lib/',
    '<rootDir>/config/',
    '<rootDir>/script/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ],
  rootDir: './'
}
