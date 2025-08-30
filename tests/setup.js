// Test setup file for Drum Machine
// This file runs before each test to set up the testing environment

// Mock Web Audio API for testing
global.AudioContext = class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = { connect: jest.fn() };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn()
    };
  }

  createMediaStreamDestination() {
    return {
      stream: {
        getTracks: () => []
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
};

global.webkitAudioContext = global.AudioContext;

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(['mock audio data'], { type: 'audio/webm' })
      });
    }
  }
};

// Mock localStorage with actual storage
const localStorageMock = {
  store: {},
  getItem: jest.fn(function (key) {
    return this.store[key] || null;
  }),
  setItem: jest.fn(function (key, value) {
    this.store[key] = value;
  }),
  removeItem: jest.fn(function (key) {
    delete this.store[key];
  }),
  clear: jest.fn(function () {
    this.store = {};
  })
};

// Replace the global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Make the mock functions available globally for tests
global.localStorageMock = localStorageMock;

// Mock URL and clipboard APIs
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn()
};

global.navigator = {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  },
  mediaDevices: {
    getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [] }))
  }
};

// Mock window.matchMedia
global.window = global;
global.matchMedia = jest.fn(() => ({
  matches: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Helper function to create a mock DOM element
global.createMockElement = (tagName, attributes = {}) => {
  const element = {
    tagName: tagName.toUpperCase(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(() => false)
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    ...attributes
  };

  // Mock getAttribute and setAttribute
  element.getAttribute = jest.fn(name => element.dataset[name] || null);
  element.setAttribute = jest.fn((name, value) => {
    element.dataset[name] = value;
  });

  return element;
};

// Helper function to create a mock DOM
global.createMockDOM = () => {
  const mockDOM = {
    body: global.createMockElement('body'),
    documentElement: global.createMockElement('html'),
    createElement: jest.fn(tagName => global.createMockElement(tagName)),
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  };

  // Set up common elements
  mockDOM.getElementById.mockImplementation(id => {
    const element = global.createMockElement('div', { id });
    mockDOM[id] = element;
    return element;
  });

  return mockDOM;
};

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();

  // Create fresh mock DOM
  global.document = global.createMockDOM();

  // Mock common DOM methods
  global.document.createElement = jest.fn(tagName =>
    global.createMockElement(tagName)
  );
  global.document.body.appendChild = jest.fn();
  global.document.body.removeChild = jest.fn();

  // Mock window
  global.window = {
    ...global.window,
    document: global.document,
    location: {
      origin: 'http://localhost:3000',
      pathname: '/',
      search: ''
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
});

// Cleanup after each test
// afterEach(() => {
//   // Clean up any timers
//   jest.clearAllTimers();
// });
