# 🧪 Drum Machine Test Suite

Comprehensive integration tests for the Drum Machine application, covering all main functionality and user workflows.

## 📋 Test Structure

### **Unit Tests**

- **`drumMachine.test.js`** - Core DrumMachine class functionality
- **`samples.test.js`** - Sound loading and management

### **End-to-End Tests**

- **`e2e.test.js`** - Complete user workflows in real browser

### **Test Configuration**

- **`setup.js`** - Test environment setup and mocks
- **`test-runner.js`** - Custom test runner with server management

## 🚀 Running Tests

### **Quick Commands**

```bash
# Run unit tests only
npm test

# Run all tests (unit + e2e)
npm run test:all

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Specific Test Types**

```bash
# Unit tests only
npm run test:unit

# End-to-end tests only (requires server)
npm run test:e2e

# Using the custom test runner
node tests/test-runner.js unit
node tests/test-runner.js e2e
node tests/test-runner.js all
```

## 🎯 Test Coverage

### **Core Functionality Tested**

#### **🎵 Sequencer**

- ✅ Grid initialization for all 9 drum types
- ✅ Step toggling (on/off)
- ✅ Pattern length changes (8, 16, 32 steps)
- ✅ Step advancement during playback
- ✅ Play/pause/stop functionality

#### **🔊 Audio System**

- ✅ Sample loading with fallback to synthesized sounds
- ✅ Audio node creation and connection
- ✅ Mute/unmute functionality (individual and global)
- ✅ Sound selection and switching
- ✅ Audio output routing for recording

#### **🔴 Recording**

- ✅ Recording state management
- ✅ Audio output capture (not microphone)
- ✅ MediaRecorder integration
- ✅ WAV file export

#### **🌙 Theme Management**

- ✅ System preference detection
- ✅ Manual theme toggling
- ✅ Theme persistence in localStorage
- ✅ Smooth theme transitions

#### **💾 Data Persistence**

- ✅ Beat pattern saving/loading
- ✅ URL encoding/decoding for sharing
- ✅ localStorage corruption recovery
- ✅ Sound selection persistence

#### **⌨️ User Input**

- ✅ Keyboard shortcuts (1-9 for drums, spacebar, c key)
- ✅ Mouse/touch interactions
- ✅ Tempo and pattern controls
- ✅ Live drum pad input

#### **📱 Responsive Design**

- ✅ Mobile viewport adaptation
- ✅ Touch-friendly interactions
- ✅ Accessibility features

### **Error Handling Tested**

- ✅ Audio context initialization failures
- ✅ Missing/corrupted audio files
- ✅ Network connectivity issues
- ✅ Invalid localStorage data
- ✅ Browser compatibility issues

## 🛠️ Test Environment

### **Dependencies**

- **Jest** - Test framework with jsdom environment
- **Puppeteer** - Browser automation for e2e tests
- **jsdom** - DOM simulation for unit tests

### **Mocks and Stubs**

- **Web Audio API** - Complete mock implementation
- **MediaRecorder** - Mock for recording functionality
- **localStorage** - Mock for data persistence testing
- **DOM APIs** - Mock elements and event handling
- **Network requests** - Mock fetch for sample loading

### **Test Data**

- **Mock audio samples** - Simulated audio buffers
- **Test patterns** - Predefined beat sequences
- **Sample sound collections** - Mock sound file structures

## 📊 Coverage Requirements

### **Minimum Coverage Thresholds**

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### **Critical Path Coverage**

- **Audio playback** - 100% (core functionality)
- **Sequencer logic** - 100% (main feature)
- **Data persistence** - 90% (user data safety)
- **Error handling** - 80% (stability)

## 🔧 Test Configuration

### **Jest Configuration**

```javascript
// jest.config.js
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  collectCoverageFrom: ['script.js', 'samples.js']
}
```

### **Puppeteer Configuration**

```javascript
// Browser launch options
{
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
}
```

## 🚨 Troubleshooting Tests

### **Common Issues**

#### **E2E Tests Failing**

- **Server not running**: Use `npm run serve` in another terminal
- **Port conflicts**: Change port in test configuration
- **Browser permissions**: Check audio/clipboard permissions

#### **Unit Tests Failing**

- **Mock issues**: Check `tests/setup.js` for proper mocks
- **Timing issues**: Increase test timeout if needed
- **Dependencies**: Run `npm install` to ensure all packages

#### **Performance Issues**

- **Slow tests**: Run unit tests only with `npm run test:unit`
- **Memory issues**: Close other applications during testing
- **Browser crashes**: Use headless mode for e2e tests

### **Debugging Tips**

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- drumMachine.test.js

# Run tests with debugging
npm test -- --detectOpenHandles

# Generate detailed coverage report
npm run test:coverage
```

## 🔮 Future Test Enhancements

### **Planned Additions**

- **Visual regression tests** - Screenshot comparisons
- **Performance benchmarks** - Load time and memory usage
- **Cross-browser testing** - Firefox, Safari, Edge
- **Accessibility testing** - Screen reader compatibility
- **Load testing** - Multiple concurrent users

### **Test Automation**

- **CI/CD integration** - Automated testing on commits
- **Pre-commit hooks** - Run tests before commits
- **Scheduled testing** - Nightly full test runs
- **Test reporting** - Integration with reporting tools

## 📈 Test Metrics

### **Success Criteria**

- **All tests pass** - 100% test success rate
- **Coverage targets met** - Minimum 70% across all metrics
- **Performance benchmarks** - Load time under 5 seconds
- **No critical errors** - Zero unhandled exceptions
- **Cross-platform compatibility** - Works on Windows, macOS, Linux

### **Quality Gates**

- **Unit tests** - Must pass before code merge
- **E2E tests** - Must pass before deployment
- **Coverage** - Must meet minimum thresholds
- **Performance** - Must meet load time requirements

---

**Happy Testing! 🧪🥁**
