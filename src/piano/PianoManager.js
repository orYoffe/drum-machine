import {
  PIANO_CONFIG,
  PIANO_KEYS,
  PIANO_LAYOUT,
  RESPONSIVE_CONFIG,
  SAMPLE_PATHS,
  STATUS_MESSAGES,
  ERROR_MESSAGES
} from '../config/constants.js';

/**
 * PianoManager Class
 * Handles all piano-related functionality including key creation,
 * sample loading, event handling, and responsive layout
 */
export class PianoManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.pianoSamples = new Map();
    this.isInitialized = false;
    this.container = null;
    this.keys = new Map();
    this.activeTouches = new Map();
    this.isMobile = window.innerWidth <= RESPONSIVE_CONFIG.MOBILE_BREAKPOINT;

    // Bind methods to preserve context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the piano
   * @param {HTMLElement} container - Container element for piano
   * @returns {Promise<boolean>} Success status
   */
  async initialize(container) {
    try {
      this.container = container;

      // Create piano keys
      this.createPianoKeys();

      // Bind events
      this.bindPianoEvents();

      // Load piano samples
      await this.loadPianoSamples();

      // Set up responsive handling
      this.setupResponsiveHandling();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize piano:', error);
      return false;
    }
  }

  /**
   * Create piano key elements
   * @private
   */
  createPianoKeys() {
    if (!this.container) return;

    // Clear existing keys
    this.container.innerHTML = '';
    this.keys.clear();

    // Create white keys first
    const whiteKeys = PIANO_KEYS.filter((key) => key.type === 'white');
    whiteKeys.forEach((keyData, index) => {
      const keyElement = this.createKeyElement(keyData, index);
      this.keys.set(keyData.index, keyElement);
      this.container.appendChild(keyElement);
    });

    // Create black keys positioned between white keys
    const blackKeys = PIANO_KEYS.filter((key) => key.type === 'black');
    blackKeys.forEach((keyData) => {
      const keyElement = this.createKeyElement(keyData);
      this.positionBlackKey(keyElement, keyData);
      this.keys.set(keyData.index, keyElement);
      this.container.appendChild(keyElement);
    });
  }

  /**
   * Create individual key element
   * @param {Object} keyData - Key data from PIANO_KEYS
   * @param {number} whiteKeyIndex - Index for white key positioning
   * @returns {HTMLElement} Key element
   * @private
   */
  createKeyElement(keyData, whiteKeyIndex = null) {
    const keyElement = document.createElement('div');
    keyElement.className = `piano-key ${keyData.type}`;
    keyElement.dataset.keyIndex = keyData.index;
    keyElement.dataset.note = keyData.note;
    keyElement.dataset.keyboardKey = keyData.key;

    // Set key content (note name + keyboard key for desktop, just note for mobile)
    if (this.isMobile) {
      keyElement.innerHTML = `<span class="piano-key-label">${keyData.note}</span>`;
    } else {
      keyElement.innerHTML = `<span class="piano-key-label">${keyData.note}</span><span class="piano-keyboard-key">${keyData.key}</span>`;
    }

    // Set key dimensions and positioning
    if (keyData.type === 'white') {
      if (this.isMobile) {
        keyElement.style.height = PIANO_LAYOUT.MOBILE.WHITE_KEY_HEIGHT;
        keyElement.style.width = PIANO_LAYOUT.MOBILE.WHITE_KEY_WIDTH;
      } else {
        keyElement.style.width = `${PIANO_LAYOUT.DESKTOP.WHITE_KEY_WIDTH}px`;
        keyElement.style.height = `${PIANO_LAYOUT.DESKTOP.WHITE_KEY_HEIGHT}px`;
        if (whiteKeyIndex !== null) {
          keyElement.style.left = `${whiteKeyIndex * PIANO_LAYOUT.DESKTOP.WHITE_KEY_WIDTH}px`;
        }
      }
    } else {
      if (this.isMobile) {
        keyElement.style.height = PIANO_LAYOUT.MOBILE.BLACK_KEY_HEIGHT;
        keyElement.style.width = PIANO_LAYOUT.MOBILE.BLACK_KEY_WIDTH;
      } else {
        keyElement.style.width = `${PIANO_LAYOUT.DESKTOP.BLACK_KEY_WIDTH}px`;
        keyElement.style.height = `${PIANO_LAYOUT.DESKTOP.BLACK_KEY_HEIGHT}px`;
      }
    }

    return keyElement;
  }

  /**
   * Position black key between white keys
   * @param {HTMLElement} keyElement - Black key element
   * @param {Object} keyData - Key data
   * @private
   */
  positionBlackKey(keyElement, keyData) {
    if (this.isMobile) {
      // Mobile: position black keys to the right (top) of white keys
      const whiteKeyIndex = this.getWhiteKeyIndexForBlackKey(keyData.index);
      const whiteKeyTop =
        whiteKeyIndex * parseInt(PIANO_LAYOUT.MOBILE.WHITE_KEY_HEIGHT);

      keyElement.style.left = '35px';
      keyElement.style.top = `${whiteKeyTop + 35}px`;
      keyElement.style.right = '0';
    } else {
      // Desktop: position black keys between white keys
      const whiteKeyIndex = this.getWhiteKeyIndexForBlackKey(keyData.index);
      const leftPosition =
        whiteKeyIndex * PIANO_LAYOUT.DESKTOP.WHITE_KEY_WIDTH +
        PIANO_LAYOUT.DESKTOP.BLACK_KEY_OFFSET;

      keyElement.style.left = `${leftPosition}px`;
      keyElement.style.top = '0';
    }
  }

  /**
   * Get white key index for positioning black keys
   * @param {number} blackKeyIndex - Black key index
   * @returns {number} White key index
   * @private
   */
  getWhiteKeyIndexForBlackKey(blackKeyIndex) {
    const blackKeyMap = {
      2: 0, // C# between C and D
      4: 1, // D# between D and E
      7: 3, // F# between F and G
      9: 4, // G# between G and A
      11: 5, // A# between A and B
      14: 6, // C# between C and D (second octave)
      16: 7, // D# between D and E (second octave)
      19: 9, // F# between F and G (second octave)
      21: 10, // G# between G and A (second octave)
      23: 11 // A# between A and B (second octave)
    };

    return blackKeyMap[blackKeyIndex] || 0;
  }

  /**
   * Load piano samples with retry mechanism
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async loadPianoSamples() {
    try {
      this.updateStatus(STATUS_MESSAGES.LOADING_PIANO);

      const loadPromises = PIANO_KEYS.map(async (keyData) => {
        const samplePath = `${SAMPLE_PATHS.PIANO}${SAMPLE_PATHS.PIANO_SAMPLE_PREFIX}${keyData.index.toString().padStart(2, '0')}${SAMPLE_PATHS.PIANO_SAMPLE_EXTENSION}`;

        try {
          const audioBuffer = await this.loadPianoSampleWithRetry(samplePath);
          this.pianoSamples.set(keyData.index, audioBuffer);
          return true;
        } catch (error) {
          console.warn(
            `Failed to load piano sample for key ${keyData.index}:`,
            error
          );
          this.pianoSamples.set(keyData.index, null); // Mark as failed
          return false;
        }
      });

      const results = await Promise.allSettled(loadPromises);
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value
      ).length;

      this.updateStatus(
        `🎹 Piano samples loaded: ${successCount}/${PIANO_CONFIG.TOTAL_KEYS}`
      );

      return successCount > 0;
    } catch (error) {
      console.error('Error loading piano samples:', error);
      this.updateStatus('🎹 Failed to load piano samples');
      return false;
    }
  }

  /**
   * Load piano sample with retry mechanism
   * @param {string} filePath - Path to sample file
   * @returns {Promise<AudioBuffer>} Audio buffer
   * @private
   */
  async loadPianoSampleWithRetry(filePath) {
    let lastError;

    for (
      let attempt = 1;
      attempt <= PIANO_CONFIG.SAMPLE_RETRY_ATTEMPTS;
      attempt++
    ) {
      try {
        return await this.loadPianoSample(filePath);
      } catch (error) {
        lastError = error;

        if (attempt < PIANO_CONFIG.SAMPLE_RETRY_ATTEMPTS) {
          const delay =
            PIANO_CONFIG.SAMPLE_RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Load individual piano sample
   * @param {string} filePath - Path to sample file
   * @returns {Promise<AudioBuffer>} Audio buffer
   * @private
   */
  async loadPianoSample(filePath) {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await this.audioManager.decodeAudioData(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load piano sample: ${error.message}`);
    }
  }

  /**
   * Play piano key
   * @param {number} keyIndex - Key index to play
   * @param {number} velocity - Velocity (0-1)
   * @returns {boolean} Success status
   */
  playPianoKey(keyIndex, velocity = PIANO_CONFIG.DEFAULT_VELOCITY) {
    try {
      if (!this.audioManager || !this.audioManager.isInitialized) {
        console.warn('Audio manager not ready');
        return false;
      }

      // Try to use loaded sample first
      const sample = this.pianoSamples.get(keyIndex);
      if (sample) {
        this.audioManager.playBufferSource(sample, velocity);
        return true;
      }

      // Fallback to synthesized sound
      const keyData = PIANO_KEYS.find((key) => key.index === keyIndex);
      if (keyData && keyData.frequency) {
        const synthesizedSound = this.createSynthesizedPianoSound(
          keyData.frequency
        );
        this.audioManager.playBufferSource(synthesizedSound, velocity);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error playing piano key:', error);
      return false;
    }
  }

  /**
   * Create synthesized piano sound as fallback
   * @param {number} frequency - Frequency in Hz
   * @returns {AudioBuffer} Synthesized audio buffer
   * @private
   */
  createSynthesizedPianoSound(frequency) {
    try {
      const sampleRate = this.audioManager.audioContext.sampleRate;
      const duration = 0.5; // 500ms
      const frameCount = Math.floor(sampleRate * duration);

      const audioBuffer = this.audioManager.createAudioBuffer(
        1,
        frameCount,
        sampleRate
      );
      const channelData = audioBuffer.getChannelData(0);

      // Generate sine wave with exponential decay
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        const decay = Math.exp(-time * 3); // Exponential decay
        channelData[i] = Math.sin(2 * Math.PI * frequency * time) * decay * 0.3;
      }

      return audioBuffer;
    } catch (error) {
      console.error('Error creating synthesized piano sound:', error);
      return null;
    }
  }

  /**
   * Bind piano events
   * @private
   */
  bindPianoEvents() {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart);
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('touchcancel', this.handleTouchCancel);

    // Mouse events for desktop
    if (!this.isMobile) {
      this.keys.forEach((keyElement) => {
        keyElement.addEventListener('mousedown', () =>
          this.handleKeyPress(keyElement)
        );
        keyElement.addEventListener('mouseup', () =>
          this.handleKeyRelease(keyElement)
        );
        keyElement.addEventListener('mouseleave', () =>
          this.handleKeyRelease(keyElement)
        );
      });
    }
  }

  /**
   * Handle keyboard key down
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyDown(event) {
    if (this.isMobile) return; // Skip keyboard on mobile

    const keyData = PIANO_KEYS.find(
      (key) => key.key === event.key.toUpperCase()
    );
    if (keyData) {
      event.preventDefault();
      const keyElement = this.keys.get(keyData.index);
      if (keyElement && !keyElement.classList.contains('active')) {
        this.handleKeyPress(keyElement);
      }
    }
  }

  /**
   * Handle keyboard key up
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyUp(event) {
    if (this.isMobile) return; // Skip keyboard on mobile

    const keyData = PIANO_KEYS.find(
      (key) => key.key === event.key.toUpperCase()
    );
    if (keyData) {
      event.preventDefault();
      const keyElement = this.keys.get(keyData.index);
      if (keyElement && keyElement.classList.contains('active')) {
        this.handleKeyRelease(keyElement);
      }
    }
  }

  /**
   * Handle touch start
   * @param {TouchEvent} event - Touch event
   * @private
   */
  handleTouchStart(event) {
    let pianoKeyTouched = false;

    event.changedTouches.forEach((touch) => {
      const touchId = touch.identifier;
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const pianoKey = element?.closest('.piano-key');

      if (pianoKey) {
        pianoKeyTouched = true;
        this.activeTouches.set(touchId, pianoKey);
        this.handleKeyPress(pianoKey);
      }
    });

    // Only prevent default if we actually touched a piano key
    if (pianoKeyTouched) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch end
   * @param {TouchEvent} event - Touch event
   * @private
   */
  handleTouchEnd(event) {
    let pianoKeyReleased = false;

    event.changedTouches.forEach((touch) => {
      const touchId = touch.identifier;
      const pianoKey = this.activeTouches.get(touchId);

      if (pianoKey) {
        pianoKeyReleased = true;
        this.activeTouches.delete(touchId);
        this.handleKeyRelease(pianoKey);
      }
    });

    // Only prevent default if we actually released a piano key
    if (pianoKeyReleased) {
      event.preventDefault();
    }
  }

  /**
   * Handle touch cancel
   * @param {TouchEvent} event - Touch event
   * @private
   */
  handleTouchCancel(event) {
    let pianoKeyCancelled = false;

    event.changedTouches.forEach((touch) => {
      const touchId = touch.identifier;
      const pianoKey = this.activeTouches.get(touchId);

      if (pianoKey) {
        pianoKeyCancelled = true;
        this.activeTouches.delete(touchId);
        this.handleKeyRelease(pianoKey);
      }
    });

    // Only prevent default if we actually cancelled a piano key
    if (pianoKeyCancelled) {
      event.preventDefault();
    }
  }

  /**
   * Handle key press
   * @param {HTMLElement} keyElement - Key element
   * @private
   */
  handleKeyPress(keyElement) {
    if (!keyElement || keyElement.classList.contains('active')) return;

    keyElement.classList.add('active');
    const keyIndex = parseInt(keyElement.dataset.keyIndex);
    this.playPianoKey(keyIndex);
  }

  /**
   * Handle key release
   * @param {HTMLElement} keyElement - Key element
   * @private
   */
  handleKeyRelease(keyElement) {
    if (!keyElement) return;

    keyElement.classList.remove('active');
  }

  /**
   * Setup responsive handling
   * @private
   */
  setupResponsiveHandling() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize(); // Initial check
  }

  /**
   * Handle window resize
   * @private
   */
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= RESPONSIVE_CONFIG.MOBILE_BREAKPOINT;

    // Recreate keys if mobile state changed
    if (wasMobile !== this.isMobile) {
      this.createPianoKeys();
      this.bindPianoEvents();
    }
  }

  /**
   * Update status message
   * @param {string} message - Status message
   * @private
   */
  updateStatus(message) {
    // This would typically update a status display element
    // For now, just log to console
    console.log(message);
  }

  /**
   * Get piano state
   * @returns {Object} Piano state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isMobile: this.isMobile,
      totalKeys: PIANO_CONFIG.TOTAL_KEYS,
      loadedSamples: this.pianoSamples.size,
      activeTouches: this.activeTouches.size
    };
  }

  /**
   * Destroy piano manager
   */
  destroy() {
    try {
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
      document.removeEventListener('touchstart', this.handleTouchStart);
      document.removeEventListener('touchend', this.handleTouchEnd);
      document.removeEventListener('touchcancel', this.handleTouchCancel);
      window.removeEventListener('resize', this.handleResize);

      // Clear references
      this.keys.clear();
      this.activeTouches.clear();
      this.pianoSamples.clear();
      this.container = null;
      this.audioManager = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error destroying piano manager:', error);
    }
  }
}

export default PianoManager;
