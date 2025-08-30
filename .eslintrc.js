module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',

    // Best practices
    eqeqeq: 'error',
    curly: 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',

    // ES6+ features
    'arrow-spacing': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',

    // Code style
    indent: ['warn', 2],
    quotes: ['warn', 'single', { avoidEscape: true }],
    semi: ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    'no-trailing-spaces': 'warn',
    'eol-last': 'warn'
  },
  globals: {
    // Browser globals
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
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
    afterEach: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    jest: 'readonly'
  }
};
