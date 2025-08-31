# Development Guide

## 🏗️ **Architecture Overview**

The Drum Machine has been refactored into a modular architecture for better maintainability:

```
src/
├── main.js                 # Main entry point
├── DrumMachine.js         # Core application class
├── audio/
│   └── AudioManager.js    # Web Audio API management
├── storage/
│   └── BeatStorage.js     # Local storage operations
├── piano/
│   └── PianoManager.js    # Piano functionality
└── config/
    └── constants.js       # Application constants
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm 9+

### **Installation**
```bash
npm install
```

### **Development Commands**
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code formatting
npm run format:check

# Build for production
npm run build

# Build in watch mode
npm run build:watch
```

## 🧪 **Testing Strategy**

### **Test Structure**
- **Unit Tests**: Test individual classes and methods
- **Integration Tests**: Test interactions between modules
- **E2E Tests**: Test complete user workflows

### **Test Coverage**
- Core functionality: 90%+
- Audio handling: 85%+
- Storage operations: 95%+
- Piano functionality: 80%+

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/audio.test.js

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 📁 **Code Organization**

### **Module Responsibilities**

#### **AudioManager** (`src/audio/AudioManager.js`)
- Web Audio API initialization
- Audio context state management
- Sample loading and management
- Cross-platform audio compatibility

#### **BeatStorage** (`src/storage/BeatStorage.js`)
- Local storage operations
- Beat data persistence
- Theme and settings storage
- Data validation and error handling

#### **PianoManager** (`src/piano/PianoManager.js`)
- Piano key creation and positioning
- Sample loading with fallbacks
- Event handling (mouse, touch, keyboard)
- Responsive layout management

#### **Constants** (`src/config/constants.js`)
- Application configuration
- Magic numbers and strings
- Error and success messages
- UI breakpoints and timing

### **File Naming Conventions**
- **Classes**: PascalCase (e.g., `AudioManager`)
- **Files**: PascalCase for classes, camelCase for utilities
- **Constants**: UPPER_SNAKE_CASE
- **Methods**: camelCase
- **Private methods**: Start with underscore (e.g., `_privateMethod`)

## 🔧 **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Run tests
npm test

# Lint and format
npm run lint:fix
npm run format

# Commit changes
git commit -m "feat: add new feature"
```

### **2. Code Quality Checks**
```bash
# Before committing, ensure:
npm run lint          # No linting errors
npm run format:check  # Code is properly formatted
npm test             # All tests pass
npm run build        # Build succeeds
```

### **3. Pull Request Process**
1. **Create PR** with descriptive title and description
2. **Run CI checks** automatically
3. **Code review** by team members
4. **Address feedback** and update PR
5. **Merge** when approved

## 🎯 **Coding Standards**

### **JavaScript Style Guide**
- Use ES6+ features (const, let, arrow functions, destructuring)
- Prefer functional programming where appropriate
- Use meaningful variable and function names
- Add JSDoc comments for public methods
- Handle errors gracefully with try-catch blocks

### **Example Code Structure**
```javascript
/**
 * Loads piano samples with retry mechanism
 * @param {string} filePath - Path to the sample file
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<AudioBuffer|null>} Loaded audio buffer or null
 */
async loadPianoSampleWithRetry(filePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const audioBuffer = await this.loadPianoSample(filePath);
      if (audioBuffer) return audioBuffer;
    } catch (error) {
      if (attempt === maxRetries) {
        console.warn(`Failed after ${maxRetries} attempts:`, filePath);
        return null;
      }
      await this.delay(Math.pow(2, attempt) * 100);
    }
  }
  return null;
}
```

### **Error Handling**
```javascript
// Always use try-catch for async operations
try {
  const result = await this.riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Provide fallback or user-friendly error
  return this.getFallbackValue();
}
```

### **Constants Usage**
```javascript
// Instead of magic numbers
if (window.innerWidth <= 768) { ... }

// Use constants
import { UI } from './config/constants.js';
if (window.innerWidth <= UI.MOBILE_BREAKPOINT) { ... }
```

## 🧹 **Code Maintenance**

### **Regular Tasks**
- **Weekly**: Run full test suite and update dependencies
- **Monthly**: Review and update documentation
- **Quarterly**: Code quality audit and refactoring

### **Performance Monitoring**
- Bundle size analysis
- Audio latency measurements
- Memory usage tracking
- Cross-browser compatibility testing

### **Security Considerations**
- Sanitize user inputs
- Validate data before storage
- Use HTTPS in production
- Regular dependency updates

## 🚨 **Common Issues & Solutions**

### **Audio Context Issues**
```javascript
// Problem: Audio context suspended
// Solution: Resume on user interaction
document.addEventListener('click', async () => {
  await audioManager.resumeAudioContext();
});
```

### **Storage Issues**
```javascript
// Problem: Corrupted localStorage data
// Solution: Graceful fallback
try {
  const data = JSON.parse(localStorage.getItem(key));
  return data;
} catch (error) {
  localStorage.removeItem(key); // Clean up corrupted data
  return defaultValue;
}
```

### **Mobile Compatibility**
```javascript
// Problem: Touch events interfering with scroll
// Solution: Conditional preventDefault
document.addEventListener('touchstart', (e) => {
  const pianoKey = e.target.closest('.piano-key');
  if (pianoKey) {
    e.preventDefault(); // Only prevent for piano interactions
  }
});
```

## 📚 **Resources**

### **Documentation**
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)

### **Tools**
- **VS Code Extensions**: ESLint, Prettier, Jest Runner
- **Browser DevTools**: Web Audio API debugging
- **Performance**: Lighthouse, WebPageTest

### **Best Practices**
- [JavaScript Clean Code](https://github.com/ryanmcdermott/clean-code-javascript)
- [Web Audio Best Practices](https://developers.google.com/web/fundamentals/media/audio)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

## 🤝 **Contributing**

### **Before Contributing**
1. Read this development guide
2. Set up development environment
3. Run existing tests to ensure they pass
4. Create feature branch from main

### **Pull Request Guidelines**
- **Title**: Use conventional commits format
- **Description**: Explain what and why, not how
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant docs
- **Breaking Changes**: Clearly mark and explain

### **Code Review Checklist**
- [ ] Code follows style guide
- [ ] Tests pass and coverage is adequate
- [ ] No console.log statements in production code
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Mobile compatibility tested
- [ ] Documentation updated

---

**Remember**: Good code is readable, testable, and maintainable. When in doubt, prioritize clarity over cleverness.
