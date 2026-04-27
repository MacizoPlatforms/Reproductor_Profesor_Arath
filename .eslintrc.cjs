module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['security', 'react'],
  rules: {
    'security/detect-eval-with-expression': 'error',
  },
}
