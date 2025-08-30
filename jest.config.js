module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test timeout
  testTimeout: 10000,

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']

  // No coverage thresholds for now
  // coverageThreshold: {
  //   global: {
  //     statements: 70,
  //     branches: 70,
  //     functions: 70,
  //     lines: 70
  //   }
  // }
};
