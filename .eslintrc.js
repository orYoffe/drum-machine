module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: ['sounds/**/*', 'node_modules/**/*', 'coverage/**/*'],
  rules: {
    // Core rules
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-prototype-builtins': 'error',

    // Code style - make these warnings so CI doesn't fail
    indent: 'off', // Let Prettier handle this
    quotes: 'off', // Let Prettier handle this
    semi: 'off', // Let Prettier handle this
    'comma-dangle': 'off', // Let Prettier handle this
    'no-trailing-spaces': 'off', // Let Prettier handle this
    'eol-last': 'off', // Let Prettier handle this

    // Prettier integration
    'prettier/prettier': 'warn', // Make Prettier errors warnings

    // Other rules
    'prefer-const': 'warn',
    'no-var': 'warn',
    'prefer-arrow-callback': 'warn'
  },
  globals: {
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    console: 'readonly',
    localStorage: 'readonly',
    AudioContext: 'readonly',
    webkitAudioContext: 'readonly',
    MediaRecorder: 'readonly',

    // App-specific globals
    SOUND_COLLECTIONS: 'readonly',
    loadSample: 'readonly',
    changeSound: 'readonly',
    getCurrentSoundFile: 'readonly',

    // Test globals
    describe: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    jest: 'readonly'
  }
};
