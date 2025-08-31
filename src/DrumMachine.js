/**
 * DrumMachine - Main application orchestrator
 * Coordinates all managers and provides the main application interface
 */

import { AudioManager } from './audio/AudioManager.js';
import { BeatStorage } from './storage/BeatStorage.js';
import { PianoManager } from './piano/PianoManager.js';
import { SequencerManager } from './sequencer/SequencerManager.js';
import { ControlManager } from './controls/ControlManager.js';
import { ModalManager } from './modals/ModalManager.js';
import {
  STORAGE_KEYS,
  createDefaultBeat,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './config/constants.js';

export class DrumMachine {
  constructor(audioManager, beatStorage, pianoManager) {
    this.audioManager = audioManager;
    this.beatStorage = beatStorage;
    this.pianoManager = pianoManager;

    // Initialize other managers
    this.sequencerManager = null;
    this.controlManager = null;
    this.modalManager = null;

    // Application state
    this.currentBeat = null;
    this.isInitialized = false;
    this.statusElement = null;

    // Bind methods
    this.handleTempoChange = this.handleTempoChange.bind(this);
    this.handlePatternLengthChange = this.handlePatternLengthChange.bind(this);
    this.handlePlayStateChange = this.handlePlayStateChange.bind(this);
    this.handleRecordingChange = this.handleRecordingChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  /**
   * Initialize the drum machine application
   */
  async initialize() {
    try {
      console.log('🎵 Initializing Drum Machine...');

      // Initialize audio manager
      await this.audioManager.initialize();

      // Initialize UI managers
      this.initializeUIManagers();

      // Set up event handlers
      this.setupEventHandlers();

      // Initialize application state
      await this.initializeApplicationState();

      // Initialize piano
      await this.initializePiano();

      this.isInitialized = true;
      console.log('🎵 Drum Machine initialized successfully!');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Drum Machine:', error);
      this.updateStatus(ERROR_MESSAGES.INITIALIZATION_FAILED);
      return false;
    }
  }

  /**
   * Initialize UI managers
   */
  initializeUIManagers() {
    // Get DOM containers
    const sequencerContainer = document.getElementById('sequencer-grid');

    if (!sequencerContainer) {
      throw new Error('Required DOM containers not found');
    }

    // Initialize sequencer manager
    this.sequencerManager = new SequencerManager(sequencerContainer, {
      onStepToggle: this.handleStepToggle.bind(this),
      onPatternLengthChange: this.handlePatternLengthChange.bind(this)
    });

    // Initialize modal manager
    this.modalManager = new ModalManager();
    this.modalManager.initialize();

    // Initialize UI components
    this.sequencerManager.createGrid();

    // Set up event handlers for existing controls
    this.setupControlEventHandlers();
  }

  /**
   * Set up global event handlers
   */
  setupEventHandlers() {
    // Global audio context resume on user interaction
    const resumeAudioOnInteraction = async (event) => {
      // Don't resume if clicking piano header (to avoid conflicts)
      if (event.target.closest('#piano-header')) {
        return;
      }

      try {
        await this.audioManager.resumeAudioContext();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    };

    // Add event listeners
    document.addEventListener('click', resumeAudioOnInteraction);
    document.addEventListener('touchstart', resumeAudioOnInteraction);
    document.addEventListener('keydown', resumeAudioOnInteraction);

    // Start audio health check
    this.startAudioHealthCheck();
  }

  /**
   * Set up event handlers for existing controls
   */
  setupControlEventHandlers() {
    // Play button
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => this.handlePlayStateChange(true));
    }

    // Stop button
    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () =>
        this.handlePlayStateChange(false)
      );
    }

    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClear());
    }

    // Tempo control
    const tempoControl = document.getElementById('tempo');
    if (tempoControl) {
      tempoControl.addEventListener('input', (e) => {
        this.handleTempoChange(parseInt(e.target.value));
      });
    }

    // Pattern length control
    const patternLengthControl = document.getElementById('pattern-length');
    if (patternLengthControl) {
      patternLengthControl.addEventListener('change', (e) => {
        this.handlePatternLengthChange(parseInt(e.target.value));
      });
    }

    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareBeat());
    }

    // Load button
    const loadBtn = document.getElementById('load-btn');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => this.showBeatSelectionModal());
    }

    // Load from URL button
    const loadUrlBtn = document.getElementById('load-url-btn');
    if (loadUrlBtn) {
      loadUrlBtn.addEventListener('click', () => this.promptForURL());
    }

    // Save local button
    const saveLocalBtn = document.getElementById('save-local-btn');
    if (saveLocalBtn) {
      saveLocalBtn.addEventListener('click', () => this.showSaveBeatModal());
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Drum pad buttons
    document.querySelectorAll('.drum-pad').forEach((pad) => {
      pad.addEventListener('click', () => this.playSound(pad.dataset.sound));
    });

    // Mute buttons
    document.querySelectorAll('.mute-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.toggleMute(btn.dataset.drum));
    });
  }

  /**
   * Initialize application state
   */
  async initializeApplicationState() {
    try {
      // Check for URL parameters first (shared beat)
      const urlParams = new URLSearchParams(window.location.search);
      const beatData = urlParams.get('beat');

      if (beatData) {
        // Load shared beat from URL
        await this.loadBeatFromURL(beatData);
        this.updateStatus(SUCCESS_MESSAGES.BEAT_LOADED_FROM_URL);
      } else {
        // Load last used beat from local storage
        await this.loadLastUsedBeat();
      }
    } catch (error) {
      console.warn('Failed to load initial beat, using default:', error);
      this.currentBeat = createDefaultBeat();
      this.updateStatus('Using default beat');
    }
  }

  /**
   * Initialize piano
   */
  async initializePiano() {
    try {
      const pianoContainer = document.getElementById('piano-keys');
      if (pianoContainer) {
        await this.pianoManager.initialize(pianoContainer);
      }
    } catch (error) {
      console.warn('Failed to initialize piano:', error);
    }
  }

  /**
   * Prompt user for URL to load beat from
   */
  promptForURL() {
    try {
      const url = prompt('Enter the URL with beat data:');
      if (url) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const beatData = urlParams.get('beat');
        if (beatData) {
          this.loadBeatFromURL(beatData);
        } else {
          this.updateStatus('No beat data found in URL');
        }
      }
    } catch (error) {
      console.error('Failed to parse URL:', error);
      this.updateStatus('Invalid URL format');
    }
  }

  /**
   * Load beat from URL
   */
  async loadBeatFromURL(beatData) {
    try {
      const decodedData = this.decodeBeatData(beatData);
      if (decodedData) {
        this.currentBeat = decodedData;
        this.updateSequencerDisplay();
        this.updateStatus(SUCCESS_MESSAGES.BEAT_LOADED_FROM_URL);
        return true;
      }
    } catch (error) {
      console.error('Failed to load beat from URL:', error);
      this.updateStatus(ERROR_MESSAGES.INVALID_URL_DATA);
    }
    return false;
  }

  /**
   * Load last used beat from local storage
   */
  async loadLastUsedBeat() {
    try {
      const lastUsedBeat = this.beatStorage.getLastUsedBeat();
      if (lastUsedBeat) {
        this.currentBeat = lastUsedBeat;
        this.updateSequencerDisplay();
        this.updateStatus(`Loaded: ${lastUsedBeat.name}`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load last used beat:', error);
    }
    return false;
  }

  /**
   * Load beat by name from local storage
   */
  async loadBeat(name) {
    try {
      const beat = this.beatStorage.loadBeat(name);
      if (beat) {
        this.currentBeat = beat;
        this.updateSequencerDisplay();
        this.updateStatus(`Loaded: ${beat.name}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to load beat:', error);
      this.updateStatus(ERROR_MESSAGES.LOAD_FAILED);
    }
    return false;
  }

  /**
   * Save current beat
   */
  async saveBeat(name, overwrite = false) {
    try {
      if (!this.currentBeat) {
        throw new Error('No beat to save');
      }

      const success = this.beatStorage.saveBeat(
        name,
        this.currentBeat,
        overwrite
      );
      if (success) {
        this.updateStatus(SUCCESS_MESSAGES.BEAT_SAVED);
        return true;
      }
    } catch (error) {
      console.error('Failed to save beat:', error);
      this.updateStatus(ERROR_MESSAGES.SAVE_FAILED);
    }
    return false;
  }

  /**
   * Share current beat
   */
  shareBeat() {
    try {
      if (!this.currentBeat) {
        throw new Error('No beat to share');
      }

      const optimizedData = this.optimizeBeatData(this.currentBeat);
      const encodedData = this.encodeBeatData(optimizedData);
      const shareUrl = `${window.location.origin}${window.location.pathname}?beat=${encodedData}`;

      // Try to copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            this.updateStatus(SUCCESS_MESSAGES.LINK_COPIED);
          })
          .catch(() => {
            this.fallbackCopyToClipboard(shareUrl);
          });
      } else {
        this.fallbackCopyToClipboard(shareUrl);
      }

      return shareUrl;
    } catch (error) {
      console.error('Failed to share beat:', error);
      this.updateStatus(ERROR_MESSAGES.SHARE_FAILED);
      return null;
    }
  }

  /**
   * Fallback copy to clipboard
   */
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.updateStatus(SUCCESS_MESSAGES.LINK_COPIED);
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.updateStatus(ERROR_MESSAGES.COPY_FAILED);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Show beat selection modal
   */
  showBeatSelectionModal() {
    try {
      const beats = this.beatStorage.loadAllBeats();
      this.modalManager.showBeatSelectionModal(beats, (beat) => {
        this.loadBeat(beat.name);
        this.modalManager.hideBeatSelectionModal();
      });
    } catch (error) {
      console.error('Failed to show beat selection modal:', error);
      this.updateStatus(ERROR_MESSAGES.MODAL_FAILED);
    }
  }

  /**
   * Show save beat modal
   */
  showSaveBeatModal() {
    try {
      this.modalManager.showSaveBeatModal(
        this.currentBeat,
        async (name, overwrite) => {
          const success = await this.saveBeat(name, overwrite);
          if (success) {
            this.modalManager.hideSaveBeatModal();
          }
        }
      );
    } catch (error) {
      console.error('Failed to show save beat modal:', error);
      this.updateStatus(ERROR_MESSAGES.MODAL_FAILED);
    }
  }

  /**
   * Handle step toggle in sequencer
   */
  handleStepToggle(drumType, stepIndex) {
    if (!this.currentBeat || !this.currentBeat.sequencer) {
      return;
    }

    // Toggle step state
    const currentState = this.currentBeat.sequencer[drumType][stepIndex];
    this.currentBeat.sequencer[drumType][stepIndex] = !currentState;

    // Update display
    this.sequencerManager.setStepState(drumType, stepIndex, !currentState);
  }

  /**
   * Handle tempo change
   */
  handleTempoChange(tempo) {
    if (this.currentBeat) {
      this.currentBeat.tempo = tempo;
    }
  }

  /**
   * Handle pattern length change
   */
  handlePatternLengthChange(length) {
    if (this.currentBeat && this.currentBeat.sequencer) {
      // Update sequencer grid size
      this.sequencerManager.updateGridSize(length);

      // Update all drum patterns
      Object.keys(this.currentBeat.sequencer).forEach((drumType) => {
        const currentPattern = this.currentBeat.sequencer[drumType];
        if (currentPattern.length !== length) {
          // Extend or truncate pattern
          if (length > currentPattern.length) {
            this.currentBeat.sequencer[drumType] = [
              ...currentPattern,
              ...new Array(length - currentPattern.length).fill(false)
            ];
          } else {
            this.currentBeat.sequencer[drumType] = currentPattern.slice(
              0,
              length
            );
          }
        }
      });

      // Update sequencer display
      this.updateSequencerDisplay();
    }
  }

  /**
   * Handle play state change
   */
  handlePlayStateChange(playing) {
    if (playing) {
      this.startPlayback();
    } else {
      this.stopPlayback();
    }
  }

  /**
   * Handle recording change
   */
  handleRecordingChange(recording) {
    if (recording) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  /**
   * Handle clear
   */
  handleClear() {
    this.clearBeat();
  }

  /**
   * Start playback
   */
  startPlayback() {
    if (!this.currentBeat || !this.sequencerManager) {
      return;
    }

    try {
      this.sequencerManager.startPlayback(this.currentBeat.tempo);
      this.updateStatus('Playing...');
    } catch (error) {
      console.error('Failed to start playback:', error);
      this.updateStatus(ERROR_MESSAGES.PLAYBACK_FAILED);
    }
  }

  /**
   * Stop playback
   */
  stopPlayback() {
    if (this.sequencerManager) {
      this.sequencerManager.stopPlayback();
      this.updateStatus('Stopped');
    }
  }

  /**
   * Start recording
   */
  startRecording() {
    // TODO: Implement recording functionality
    this.updateStatus('Recording started');
  }

  /**
   * Play sound for drum pad
   */
  playSound(soundType) {
    try {
      if (this.audioManager && this.audioManager.isInitialized) {
        // TODO: Implement actual sound playback
        this.updateStatus(`Playing ${soundType} sound`);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  /**
   * Toggle mute for drum type
   */
  toggleMute(drumType) {
    try {
      // TODO: Implement mute functionality
      this.updateStatus(`Toggled mute for ${drumType}`);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    try {
      const body = document.body;
      const isDark = body.classList.contains('dark-theme');

      if (isDark) {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        this.updateStatus('Switched to light theme');
      } else {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        this.updateStatus('Switched to dark theme');
      }
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    // TODO: Implement recording functionality
    this.updateStatus('Recording stopped');
  }

  /**
   * Clear current beat
   */
  clearBeat() {
    this.currentBeat = createDefaultBeat();
    this.updateSequencerDisplay();
    this.updateStatus('Beat cleared');
  }

  /**
   * Update sequencer display
   */
  updateSequencerDisplay() {
    if (this.sequencerManager && this.currentBeat) {
      this.sequencerManager.setSequencerData(this.currentBeat.sequencer);
    }
  }

  /**
   * Update status display
   */
  updateStatus(message) {
    if (!this.statusElement) {
      this.statusElement = document.getElementById('status-text');
    }

    if (this.statusElement) {
      this.statusElement.textContent = message;
    }

    console.log(`Status: ${message}`);
  }

  /**
   * Start audio health check
   */
  startAudioHealthCheck() {
    setInterval(() => {
      if (this.audioManager) {
        const health = this.audioManager.checkAudioContextHealth();
        if (!health.healthy) {
          console.warn('Audio context health check failed:', health.message);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Optimize beat data for sharing (only include non-default values)
   */
  optimizeBeatData(beat) {
    if (!beat || !beat.sequencer) {
      return beat;
    }

    const optimized = {
      tempo: beat.tempo,
      sequencer: {}
    };

    // Only include drum types that have non-default patterns
    Object.keys(beat.sequencer).forEach((drumType) => {
      const pattern = beat.sequencer[drumType];
      const hasNonDefaultValues = pattern.some((step) => step === true);

      if (hasNonDefaultValues) {
        // Only include steps that are true (non-default)
        optimized.sequencer[drumType] = pattern
          .map((step, index) => (step ? index : -1))
          .filter((index) => index !== -1);
      }
    });

    return optimized;
  }

  /**
   * Encode beat data for URL
   */
  encodeBeatData(beatData) {
    try {
      const jsonString = JSON.stringify(beatData);
      return btoa(jsonString);
    } catch (error) {
      console.error('Failed to encode beat data:', error);
      throw error;
    }
  }

  /**
   * Decode beat data from URL
   */
  decodeBeatData(encodedData) {
    try {
      const jsonString = atob(encodedData);
      const beatData = JSON.parse(jsonString);

      // Convert optimized data back to full format
      return this.expandBeatData(beatData);
    } catch (error) {
      console.error('Failed to decode beat data:', error);
      throw error;
    }
  }

  /**
   * Expand optimized beat data back to full format
   */
  expandBeatData(optimizedData) {
    if (!optimizedData || !optimizedData.sequencer) {
      return createDefaultBeat();
    }

    const defaultBeat = createDefaultBeat();
    const expanded = {
      tempo: optimizedData.tempo || defaultBeat.tempo,
      sequencer: {}
    };

    // Expand each drum type pattern
    Object.keys(defaultBeat.sequencer).forEach((drumType) => {
      const defaultPattern = defaultBeat.sequencer[drumType];
      const patternLength = defaultPattern.length;

      if (optimizedData.sequencer[drumType]) {
        // Reconstruct pattern from optimized indices
        const expandedPattern = new Array(patternLength).fill(false);
        optimizedData.sequencer[drumType].forEach((stepIndex) => {
          if (stepIndex >= 0 && stepIndex < patternLength) {
            expandedPattern[stepIndex] = true;
          }
        });
        expanded.sequencer[drumType] = expandedPattern;
      } else {
        // Use default pattern
        expanded.sequencer[drumType] = [...defaultPattern];
      }
    });

    return expanded;
  }

  /**
   * Get current application state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      currentBeat: this.currentBeat,
      audioManager: this.audioManager?.getState(),
      beatStorage: this.beatStorage?.getState(),
      pianoManager: this.pianoManager?.getState(),
      sequencerManager: this.sequencerManager?.getState(),
      modalManager: this.modalManager?.getState()
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    try {
      // Stop playback
      this.stopPlayback();

      // Clean up managers
      if (this.sequencerManager) {
        this.sequencerManager.destroy();
      }

      if (this.modalManager) {
        this.modalManager.destroy();
      }
      if (this.pianoManager) {
        this.pianoManager.destroy();
      }
      if (this.audioManager) {
        this.audioManager.destroy();
      }

      // Remove event listeners
      document.removeEventListener('click', this.resumeAudioOnInteraction);
      document.removeEventListener('touchstart', this.resumeAudioOnInteraction);
      document.removeEventListener('keydown', this.resumeAudioOnInteraction);

      console.log('🎵 Drum Machine destroyed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default DrumMachine;
