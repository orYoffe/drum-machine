// Drum Machine Application Constants
// Centralized configuration for all magic numbers, strings, and settings

// Audio Configuration
export const AUDIO_CONFIG = {
  DEFAULT_SAMPLE_RATE: 44100,
  MOBILE_SAMPLE_RATE: 22050,
  LATENCY_HINT: 'interactive',
  MOBILE_LATENCY_HINT: 'balanced'
};

// Tempo Configuration
export const TEMPO_CONFIG = {
  DEFAULT: 120,
  MIN: 60,
  MAX: 200,
  STEP: 1
};

// Pattern Configuration
export const PATTERN_CONFIG = {
  DEFAULT_LENGTH: 16,
  OPTIONS: [4, 8, 16, 32],
  MIN_LENGTH: 4,
  MAX_LENGTH: 32
};

// Drum Types
export const DRUM_TYPES = [
  'kick',
  'snare',
  'hihat',
  'crash',
  'tom1',
  'tom2',
  'ride',
  'clap',
  'bass'
];

// Piano Configuration
export const PIANO_CONFIG = {
  TOTAL_KEYS: 24,
  WHITE_KEYS: 14,
  BLACK_KEYS: 10,
  DEFAULT_VELOCITY: 0.8,
  SAMPLE_RETRY_ATTEMPTS: 3,
  SAMPLE_RETRY_DELAY: 1000
};

// Piano Key Mapping (note names and keyboard keys)
export const PIANO_KEYS = [
  { note: 'C', key: 'Q', type: 'white', index: 1, frequency: 261.63 },
  { note: 'C#', key: 'A', type: 'black', index: 2, frequency: 277.18 },
  { note: 'D', key: 'W', type: 'white', index: 3, frequency: 293.66 },
  { note: 'D#', key: 'S', type: 'black', index: 4, frequency: 311.13 },
  { note: 'E', key: 'E', type: 'white', index: 5, frequency: 329.63 },
  { note: 'F', key: 'R', type: 'white', index: 6, frequency: 349.23 },
  { note: 'F#', key: 'F', type: 'black', index: 7, frequency: 369.99 },
  { note: 'G', key: 'T', type: 'white', index: 8, frequency: 392.0 },
  { note: 'G#', key: 'G', type: 'black', index: 9, frequency: 415.3 },
  { note: 'A', key: 'Y', type: 'white', index: 10, frequency: 440.0 },
  { note: 'A#', key: 'H', type: 'black', index: 11, frequency: 466.16 },
  { note: 'B', key: 'U', type: 'white', index: 12, frequency: 493.88 },
  { note: 'C', key: 'I', type: 'white', index: 13, frequency: 523.25 },
  { note: 'C#', key: 'J', type: 'black', index: 14, frequency: 554.37 },
  { note: 'D', key: 'O', type: 'white', index: 15, frequency: 587.33 },
  { note: 'D#', key: 'K', type: 'black', index: 16, frequency: 622.25 },
  { note: 'E', key: 'P', type: 'white', index: 17, frequency: 659.25 },
  { note: 'F', key: 'Z', type: 'white', index: 18, frequency: 698.46 },
  { note: 'F#', key: 'X', type: 'black', index: 19, frequency: 739.99 },
  { note: 'G', key: 'C', type: 'white', index: 20, frequency: 783.99 },
  { note: 'G#', key: 'V', type: 'black', index: 21, frequency: 830.61 },
  { note: 'A', key: 'B', type: 'white', index: 22, frequency: 880.0 },
  { note: 'A#', key: 'N', type: 'black', index: 23, frequency: 932.33 },
  { note: 'B', key: 'M', type: 'white', index: 24, frequency: 987.77 }
];

// Responsive Design
export const RESPONSIVE_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1200
};

// Storage Keys
export const STORAGE_KEYS = {
  BEATS: 'drumMachineBeats',
  THEME: 'drumMachineTheme',
  MUTE_STATE: 'drumMachineMuteState',
  LAST_USED_BEAT: 'drumMachineLastUsedBeat'
};

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  MODAL_BACKDROP_OPACITY: 0.5,
  TOOLTIP_DELAY: 500,
  DEBOUNCE_DELAY: 300
};

// Error Messages
export const ERROR_MESSAGES = {
  AUDIO_CONTEXT_FAILED: 'Failed to initialize audio context',
  SAMPLE_LOAD_FAILED: 'Failed to load audio sample',
  STORAGE_FAILED: 'Failed to save to local storage',
  INVALID_BEAT_DATA: 'Invalid beat data structure',
  BEAT_NAME_EMPTY: 'Beat name cannot be empty',
  BEAT_NAME_CONFLICT: 'Beat name already exists',
  INITIALIZATION_FAILED: 'Failed to initialize application',
  INVALID_URL_DATA: 'Invalid beat data in URL',
  LOAD_FAILED: 'Failed to load beat',
  SAVE_FAILED: 'Failed to save beat',
  SHARE_FAILED: 'Failed to share beat',
  COPY_FAILED: 'Failed to copy to clipboard',
  MODAL_FAILED: 'Failed to show modal',
  PLAYBACK_FAILED: 'Failed to start playback'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  BEAT_SAVED: 'Beat saved successfully',
  BEAT_LOADED: 'Beat loaded successfully',
  BEAT_DELETED: 'Beat deleted successfully',
  SHARE_LINK_COPIED: 'Share link copied to clipboard',
  THEME_CHANGED: 'Theme changed successfully',
  BEAT_LOADED_FROM_URL: 'Beat loaded from shared link',
  LINK_COPIED: 'Link copied to clipboard'
};

// Status Messages
export const STATUS_MESSAGES = {
  LOADING_SAMPLES: '🎵 Loading audio samples...',
  LOADING_PIANO: '🎹 Loading piano samples...',
  AUDIO_SUSPENDED: '🎵 Audio suspended - click to resume',
  AUDIO_RUNNING: '🎵 Audio running normally',
  AUDIO_CLOSED: '🎵 Audio context closed - cannot recover'
};

// Default Beat Structure
export const DEFAULT_BEAT = {
  tempo: TEMPO_CONFIG.DEFAULT,
  patternLength: PATTERN_CONFIG.DEFAULT_LENGTH,
  sequencer: {}
};

// Initialize default sequencer with all drum types
DRUM_TYPES.forEach((drumType) => {
  DEFAULT_BEAT.sequencer[drumType] = new Array(
    PATTERN_CONFIG.DEFAULT_LENGTH
  ).fill(false);
});

// Export default beat as a function to avoid mutation
export const createDefaultBeat = () => JSON.parse(JSON.stringify(DEFAULT_BEAT));

// Validation Rules
export const VALIDATION_RULES = {
  TEMPO: {
    min: TEMPO_CONFIG.MIN,
    max: TEMPO_CONFIG.MAX,
    type: 'number'
  },
  PATTERN_LENGTH: {
    min: PATTERN_CONFIG.MIN_LENGTH,
    max: PATTERN_CONFIG.MAX_LENGTH,
    type: 'number',
    allowed: PATTERN_CONFIG.OPTIONS
  },
  BEAT_NAME: {
    minLength: 1,
    maxLength: 50,
    type: 'string'
  }
};

// Audio Sample Paths
export const SAMPLE_PATHS = {
  DRUMS: 'sounds/',
  PIANO: 'sounds/piano/',
  PIANO_SAMPLE_PREFIX: 'key',
  PIANO_SAMPLE_EXTENSION: '.mp3'
};

// Piano Layout Configuration
export const PIANO_LAYOUT = {
  DESKTOP: {
    WHITE_KEY_WIDTH: 50,
    WHITE_KEY_HEIGHT: 200,
    BLACK_KEY_WIDTH: 30,
    BLACK_KEY_HEIGHT: 120,
    BLACK_KEY_OFFSET: 45
  },
  MOBILE: {
    WHITE_KEY_WIDTH: '100%',
    WHITE_KEY_HEIGHT: '40px',
    BLACK_KEY_WIDTH: '50%',
    BLACK_KEY_HEIGHT: '30px',
    BLACK_KEY_OFFSET: 35
  }
};

// Export all constants as a single object for easy access
export const CONSTANTS = {
  AUDIO_CONFIG,
  TEMPO_CONFIG,
  PATTERN_CONFIG,
  DRUM_TYPES,
  PIANO_CONFIG,
  PIANO_KEYS,
  RESPONSIVE_CONFIG,
  STORAGE_KEYS,
  THEME_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_MESSAGES,
  VALIDATION_RULES,
  SAMPLE_PATHS,
  PIANO_LAYOUT
};

export default CONSTANTS;
