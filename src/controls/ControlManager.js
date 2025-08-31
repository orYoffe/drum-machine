import {
  TEMPO_CONFIG,
  PATTERN_CONFIG,
  VALIDATION_RULES,
  UI_CONFIG
} from '../config/constants.js';

/**
 * ControlManager Class
 * Handles all control-related functionality including tempo management,
 * pattern length selection, play/stop controls, and recording
 */
export class ControlManager {
  constructor(controls = {}) {
    this.controls = {
      tempoSlider: controls.tempoSlider || null,
      tempoDisplay: controls.tempoDisplay || null,
      patternSelect: controls.patternSelect || null,
      playButton: controls.playButton || null,
      stopButton: controls.stopButton || null,
      recordButton: controls.recordButton || null,
      clearButton: controls.clearButton || null,
      ...controls
    };

    this.state = {
      tempo: TEMPO_CONFIG.DEFAULT,
      patternLength: PATTERN_CONFIG.DEFAULT_LENGTH,
      isPlaying: false,
      isRecording: false,
      currentStep: 0
    };

    this.callbacks = {
      onTempoChange: null,
      onPatternLengthChange: null,
      onPlayStateChange: null,
      onRecordingChange: null,
      onClear: null
    };

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = 0;

    // Bind methods to preserve context
    this.handleTempoChange = this.handleTempoChange.bind(this);
    this.handlePatternLengthChange = this.handlePatternLengthChange.bind(this);
    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handleStopClick = this.handleStopClick.bind(this);
    this.handleRecordClick = this.handleRecordClick.bind(this);
    this.handleClearClick = this.handleClearClick.bind(this);

    // Initialize controls
    this.initializeControls();
  }

  /**
   * Initialize control elements and bind events
   * @returns {boolean} Success status
   */
  initializeControls() {
    try {
      // Initialize tempo controls
      if (this.controls.tempoSlider) {
        this.controls.tempoSlider.min = TEMPO_CONFIG.MIN;
        this.controls.tempoSlider.max = TEMPO_CONFIG.MAX;
        this.controls.tempoSlider.step = TEMPO_CONFIG.STEP;
        this.controls.tempoSlider.value = this.state.tempo;
        this.controls.tempoSlider.addEventListener(
          'input',
          this.handleTempoChange
        );
      }

      if (this.controls.tempoDisplay) {
        this.updateTempoDisplay();
      }

      // Initialize pattern length controls
      if (this.controls.patternSelect) {
        this.populatePatternOptions();
        this.controls.patternSelect.value = this.state.patternLength;
        this.controls.patternSelect.addEventListener(
          'change',
          this.handlePatternLengthChange
        );
      }

      // Initialize playback controls
      if (this.controls.playButton) {
        this.controls.playButton.addEventListener(
          'click',
          this.handlePlayClick
        );
        this.updatePlayButtonState();
      }

      if (this.controls.stopButton) {
        this.controls.stopButton.addEventListener(
          'click',
          this.handleStopClick
        );
        this.updateStopButtonState();
      }

      // Initialize recording controls
      if (this.controls.recordButton) {
        this.controls.recordButton.addEventListener(
          'click',
          this.handleRecordClick
        );
        this.updateRecordButtonState();
      }

      // Initialize clear control
      if (this.controls.clearButton) {
        this.controls.clearButton.addEventListener(
          'click',
          this.handleClearClick
        );
      }

      return true;
    } catch (error) {
      console.error('Error initializing controls:', error);
      return false;
    }
  }

  /**
   * Populate pattern length options
   * @private
   */
  populatePatternOptions() {
    if (!this.controls.patternSelect) return;

    this.controls.patternSelect.innerHTML = '';

    PATTERN_CONFIG.OPTIONS.forEach((length) => {
      const option = document.createElement('option');
      option.value = length;
      option.textContent = length;
      this.controls.patternSelect.appendChild(option);
    });
  }

  /**
   * Handle tempo change
   * @param {Event} event - Input event
   * @private
   */
  handleTempoChange(event) {
    const newTempo = parseInt(event.target.value);
    if (this.validateTempo(newTempo)) {
      this.setTempo(newTempo);
    }
  }

  /**
   * Handle pattern length change
   * @param {Event} event - Change event
   * @private
   */
  handlePatternLengthChange(event) {
    const newLength = parseInt(event.target.value);
    if (this.validatePatternLength(newLength)) {
      this.setPatternLength(newLength);
    }
  }

  /**
   * Handle play button click
   * @private
   */
  handlePlayClick() {
    if (this.state.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  /**
   * Handle stop button click
   * @private
   */
  handleStopClick() {
    this.stop();
  }

  /**
   * Handle record button click
   * @private
   */
  handleRecordClick() {
    if (this.state.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Handle clear button click
   * @private
   */
  handleClearClick() {
    this.clear();
  }

  /**
   * Set tempo value
   * @param {number} tempo - New tempo value
   * @returns {boolean} Success status
   */
  setTempo(tempo) {
    if (!this.validateTempo(tempo)) {
      return false;
    }

    const oldTempo = this.state.tempo;
    this.state.tempo = tempo;

    // Update UI
    if (this.controls.tempoSlider) {
      this.controls.tempoSlider.value = tempo;
    }
    this.updateTempoDisplay();

    // Trigger callback
    if (this.callbacks.onTempoChange) {
      this.callbacks.onTempoChange(tempo, oldTempo);
    }

    return true;
  }

  /**
   * Get current tempo
   * @returns {number} Current tempo
   */
  getTempo() {
    return this.state.tempo;
  }

  /**
   * Update tempo display
   * @private
   */
  updateTempoDisplay() {
    if (this.controls.tempoDisplay) {
      this.controls.tempoDisplay.textContent = this.state.tempo;
    }
  }

  /**
   * Set pattern length
   * @param {number} length - New pattern length
   * @returns {boolean} Success status
   */
  setPatternLength(length) {
    if (!this.validatePatternLength(length)) {
      return false;
    }

    const oldLength = this.state.patternLength;
    this.state.patternLength = length;

    // Update UI
    if (this.controls.patternSelect) {
      this.controls.patternSelect.value = length;
    }

    // Trigger callback
    if (this.callbacks.onPatternLengthChange) {
      this.callbacks.onPatternLengthChange(length, oldLength);
    }

    return true;
  }

  /**
   * Get current pattern length
   * @returns {number} Current pattern length
   */
  getPatternLength() {
    return this.state.patternLength;
  }

  /**
   * Set play state
   * @param {boolean} playing - Whether to play or stop
   * @returns {boolean} Success status
   */
  setPlayState(playing) {
    if (typeof playing !== 'boolean') {
      return false;
    }

    const wasPlaying = this.state.isPlaying;
    this.state.isPlaying = playing;

    // Update UI
    this.updatePlayButtonState();
    this.updateStopButtonState();

    // Trigger callback
    if (this.callbacks.onPlayStateChange && wasPlaying !== playing) {
      this.callbacks.onPlayStateChange(playing, wasPlaying);
    }

    return true;
  }

  /**
   * Check if currently playing
   * @returns {boolean} Playing state
   */
  isPlaying() {
    return this.state.isPlaying;
  }

  /**
   * Start playback
   * @returns {boolean} Success status
   */
  play() {
    if (this.state.isPlaying) {
      return false; // Already playing
    }

    return this.setPlayState(true);
  }

  /**
   * Stop playback
   * @returns {boolean} Success status
   */
  stop() {
    if (!this.state.isPlaying) {
      return false; // Already stopped
    }

    return this.setPlayState(false);
  }

  /**
   * Start recording
   * @returns {boolean} Success status
   */
  startRecording() {
    if (this.state.isRecording) {
      return false; // Already recording
    }

    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        console.error('MediaRecorder not supported');
        return false;
      }

      // Get audio stream from audio context
      const audioContext = this.getAudioContext();
      if (!audioContext) {
        console.error('Audio context not available');
        return false;
      }

      // Create MediaRecorder
      const stream =
        audioContext.destination.stream ||
        audioContext.createMediaStreamDestination().stream;
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Set up recording handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finalizeRecording();
      };

      // Start recording
      this.mediaRecorder.start();
      this.state.isRecording = true;
      this.recordingStartTime = Date.now();

      // Update UI
      this.updateRecordButtonState();

      // Trigger callback
      if (this.callbacks.onRecordingChange) {
        this.callbacks.onRecordingChange(true, false);
      }

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  /**
   * Stop recording
   * @returns {boolean} Success status
   */
  stopRecording() {
    if (!this.state.isRecording || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.stop();
      this.state.isRecording = false;

      // Update UI
      this.updateRecordButtonState();

      // Trigger callback
      if (this.callbacks.onRecordingChange) {
        this.callbacks.onRecordingChange(false, true);
      }

      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return false;
    }
  }

  /**
   * Finalize recording and create download
   * @private
   */
  finalizeRecording() {
    try {
      if (this.recordedChunks.length === 0) {
        console.warn('No recorded data available');
        return;
      }

      // Create blob from recorded chunks
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Generate filename with timestamp
      const duration = Math.round(
        (Date.now() - this.recordingStartTime) / 1000
      );
      a.download = `drum-machine-recording-${duration}s.webm`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Reset recording state
      this.recordedChunks = [];
      this.recordingStartTime = 0;
    } catch (error) {
      console.error('Error finalizing recording:', error);
    }
  }

  /**
   * Clear all controls and reset state
   * @returns {boolean} Success status
   */
  clear() {
    try {
      // Stop playback and recording
      this.stop();
      if (this.state.isRecording) {
        this.stopRecording();
      }

      // Reset state
      this.state = {
        tempo: TEMPO_CONFIG.DEFAULT,
        patternLength: PATTERN_CONFIG.DEFAULT_LENGTH,
        isPlaying: false,
        isRecording: false,
        currentStep: 0
      };

      // Update UI
      this.updateAllControls();

      // Trigger callback
      if (this.callbacks.onClear) {
        this.callbacks.onClear();
      }

      return true;
    } catch (error) {
      console.error('Error clearing controls:', error);
      return false;
    }
  }

  /**
   * Update all control states
   * @private
   */
  updateAllControls() {
    this.updateTempoDisplay();
    this.updatePlayButtonState();
    this.updateStopButtonState();
    this.updateRecordButtonState();
  }

  /**
   * Update play button state
   * @private
   */
  updatePlayButtonState() {
    if (!this.controls.playButton) return;

    if (this.state.isPlaying) {
      this.controls.playButton.textContent = 'Stop';
      this.controls.playButton.classList.add('playing');
    } else {
      this.controls.playButton.textContent = 'Play';
      this.controls.playButton.classList.remove('playing');
    }
  }

  /**
   * Update stop button state
   * @private
   */
  updateStopButtonState() {
    if (!this.controls.stopButton) return;

    this.controls.stopButton.disabled = !this.state.isPlaying;
  }

  /**
   * Update record button state
   * @private
   */
  updateRecordButtonState() {
    if (!this.controls.recordButton) return;

    if (this.state.isRecording) {
      this.controls.recordButton.textContent = 'Stop Recording';
      this.controls.recordButton.classList.add('recording');
    } else {
      this.controls.recordButton.textContent = 'Record';
      this.controls.recordButton.classList.remove('recording');
    }
  }

  /**
   * Validate tempo value
   * @param {number} tempo - Tempo to validate
   * @returns {boolean} Validation result
   * @private
   */
  validateTempo(tempo) {
    return (
      typeof tempo === 'number' &&
      tempo >= VALIDATION_RULES.TEMPO.min &&
      tempo <= VALIDATION_RULES.TEMPO.max
    );
  }

  /**
   * Validate pattern length
   * @param {number} length - Pattern length to validate
   * @returns {boolean} Validation result
   * @private
   */
  validatePatternLength(length) {
    return (
      typeof length === 'number' &&
      length >= VALIDATION_RULES.PATTERN_LENGTH.min &&
      length <= VALIDATION_RULES.PATTERN_LENGTH.max &&
      VALIDATION_RULES.PATTERN_LENGTH.allowed.includes(length)
    );
  }

  /**
   * Get audio context (to be implemented by audio manager)
   * @returns {AudioContext|null} Audio context or null
   * @private
   */
  getAudioContext() {
    // This should be implemented to get the audio context from the audio manager
    // For now, return null - will be set up when audio manager is connected
    return null;
  }

  /**
   * Set callback for tempo changes
   * @param {Function} callback - Callback function
   */
  onTempoChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.onTempoChange = callback;
    }
  }

  /**
   * Set callback for pattern length changes
   * @param {Function} callback - Callback function
   */
  onPatternLengthChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.onPatternLengthChange = callback;
    }
  }

  /**
   * Set callback for play state changes
   * @param {Function} callback - Callback function
   */
  onPlayStateChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.onPlayStateChange = callback;
    }
  }

  /**
   * Set callback for recording changes
   * @param {Function} callback - Callback function
   */
  onRecordingChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.onRecordingChange = callback;
    }
  }

  /**
   * Set callback for clear action
   * @param {Function} callback - Callback function
   */
  onClear(callback) {
    if (typeof callback === 'function') {
      this.callbacks.onClear = callback;
    }
  }

  /**
   * Get control state
   * @returns {Object} State object
   */
  getState() {
    return {
      ...this.state,
      controls: Object.keys(this.controls).filter(
        (key) => this.controls[key] !== null
      ),
      callbacks: Object.keys(this.callbacks).filter(
        (key) => this.callbacks[key] !== null
      )
    };
  }

  /**
   * Destroy control manager
   */
  destroy() {
    try {
      // Stop playback and recording
      this.stop();
      if (this.state.isRecording) {
        this.stopRecording();
      }

      // Remove event listeners
      if (this.controls.tempoSlider) {
        this.controls.tempoSlider.removeEventListener(
          'input',
          this.handleTempoChange
        );
      }

      if (this.controls.patternSelect) {
        this.controls.patternSelect.removeEventListener(
          'change',
          this.handlePatternLengthChange
        );
      }

      if (this.controls.playButton) {
        this.controls.playButton.removeEventListener(
          'click',
          this.handlePlayClick
        );
      }

      if (this.controls.stopButton) {
        this.controls.stopButton.removeEventListener(
          'click',
          this.handleStopClick
        );
      }

      if (this.controls.recordButton) {
        this.controls.recordButton.removeEventListener(
          'click',
          this.handleRecordClick
        );
      }

      if (this.controls.clearButton) {
        this.controls.clearButton.removeEventListener(
          'click',
          this.handleClearClick
        );
      }

      // Clear references
      this.controls = {};
      this.callbacks = {};
      this.mediaRecorder = null;
      this.recordedChunks = [];
    } catch (error) {
      console.error('Error destroying control manager:', error);
    }
  }
}

export default ControlManager;
