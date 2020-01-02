module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
		browser: true,
    node: true,
    es6: true
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  // required to lint *.js files
  plugins: ['prettier'],
  globals: {
    "Promise": "readable"
  },
  // add your custom rules here
	rules: {
		"no-console": "off",
		"prettier/prettier": "error",
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
