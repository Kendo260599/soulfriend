module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',
    
    // TypeScript specific rules - relaxed for deployment
    '@typescript-eslint/no-unused-vars': 'off', // Disable unused vars check
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Allow any type
    '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions
    '@typescript-eslint/no-var-requires': 'off',
    
    // General rules - relaxed
    'no-console': 'off', // Allow console statements
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'off', // Disable unused expressions
    'no-unused-vars': 'off', // Disable unused variables check
    'prefer-const': 'error',
    'no-var': 'error',
    'no-undef': 'off', // Disable undefined variable check
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Best practices - relaxed
    'eqeqeq': 'off', // Allow == and !=
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': 'off', // Disable trailing comma requirement
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'no-useless-escape': 'off', // Disable useless escape check
    'no-useless-catch': 'off', // Disable useless catch check
  },
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.d.ts',
  ],
};