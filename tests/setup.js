// Test setup for DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="sequencer-grid"></div>
      <div id="tempo-slider" value="120"></div>
      <div id="pattern-length-select" value="16"></div>
      <div id="play-btn">▶️ Play</div>
      <div id="clear-btn">🗑️ Clear</div>
      <div id="share-btn">🔗 Share Beat</div>
      <div id="load-btn">📂 Load Beat</div>
      <div id="load-url-btn">🌐 Load from URL</div>
      <div id="save-btn">💾 Save Beat</div>
      <div id="theme-toggle">🌙</div>
      <div id="status">Ready</div>
      <div id="status-text">Ready</div>
      <div id="mute-controls"></div>
      <div id="sound-selection"></div>
      <div id="piano-header">
        <span class="expand-icon">▶️</span>
        Piano
      </div>
      <div id="piano-keys"></div>
      <div class="piano-content"></div>
    </body>
  </html>
`, {
  url: 'http://localhost:3000'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;
global.btoa = dom.window.btoa;
global.atob = dom.window.atob;

// Mock AudioContext properly
const MockAudioContext = jest.fn().mockImplementation(() => ({
  state: 'suspended',
  resume: jest.fn().mockResolvedValue(),
  createBufferSource: jest.fn().mockReturnValue({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  }),
  decodeAudioData: jest.fn().mockResolvedValue({}),
  destination: {}
}));

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  value: 1200,
  writable: true
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue()
  },
  writable: true
});

// Mock user agent for mobile detection
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  writable: true
});

// Mock console to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

