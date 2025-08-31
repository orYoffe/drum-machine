class DrumMachine {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.currentStep = 0;
    this.tempo = 120;
    this.patternLength = 16;
    this.sequencer = null;
    this.samples = {};

    // High-quality drum samples using Web Audio API synthesis
    this.sampleUrls = null; // We'll generate better sounds directly

    this.drumTypes = [
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

    // Mute state for each drum type
    this.mutedDrums = {};
    this.drumTypes.forEach((type) => {
      this.mutedDrums[type] = false;
    });

    // Recording state
    this.isRecording = false;
    this.recordingBuffer = [];
    this.recordingStartTime = 0;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingDestination = null; // For capturing audio output

    this.init();
  }

  async init() {
    try {
      // Initialize audio context with better cross-platform support
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100,
        // Better compatibility for mobile and Linux
        ...(navigator.userAgent.includes('Mobile') && {
          latencyHint: 'balanced',
          sampleRate: 22050
        })
      });

      // Audio context starts suspended (normal behavior)
      if (this.audioContext.state === 'suspended') {
        this.updateStatus('🎵 Click anywhere to enable audio');
      }

      // Load samples with retry mechanism
      await this.loadSamplesWithRetry();

      // Initialize sequencer
      this.initSequencer();

      // Initialize UI
      this.initUI();

      // Load from URL if present, otherwise load last used beat from local storage
      const urlParams = new URLSearchParams(window.location.search);
      const beatParam = urlParams.get('beat');

      if (beatParam) {
        // URL parameter present - load from URL
        this.loadFromURL();
      } else {
        // No URL parameter - load last used beat from local storage (if any)
        this.loadLastUsedBeat();
      }

      // Load saved theme
      this.loadTheme();

      // Load mute state
      this.loadMuteState();

      // Initialize mute buttons
      this.initMuteButtons();

      // Update load button text to show beat count
      this.updateLoadButtonText();

      // Start periodic audio health check
      this.startAudioHealthCheck();

      // Initialize piano tool
      this.initPiano();

      this.updateStatus('Ready to create beats!');
    } catch (error) {
      console.error('Failed to initialize drum machine:', error);
      this.updateStatus('Failed to initialize audio. Please refresh the page.');
    }
  }

  startAudioHealthCheck() {
    // Check audio context health every 10 seconds
    setInterval(() => {
      if (this.audioContext && this.audioContext.state === 'closed') {
        this.updateStatus('Audio context closed. Please refresh the page.');
      }
      // Don't show warnings for suspended state - that's normal until user interaction
    }, 10000);
  }

  async loadSamplesWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.updateStatus(
          `Loading audio samples (attempt ${attempt}/${maxRetries})...`
        );

        // Don't try to resume audio context during initialization
        // It will be resumed when user interacts with the page
        if (this.audioContext.state === 'closed') {
          throw new Error('Audio context is closed');
        }

        // Load local drum samples with fallback to synthesized sounds
        const loadPromises = this.drumTypes.map(async (type) => {
          try {
            const audioBuffer = await loadSample(this.audioContext, type);
            if (audioBuffer) {
              this.samples[type] = audioBuffer;
              return true;
            } else {
              // Fallback to synthesized sound if loading fails
              console.warn(
                `Using synthesized sound for ${type} - sample loading failed`
              );
              this.samples[type] = this.createSynthesizedSound(type);
              return true;
            }
          } catch (error) {
            console.error(`Failed to load ${type} sample:`, error);
            // Fallback to synthesized sound
            this.samples[type] = this.createSynthesizedSound(type);
            return true;
          }
        });

        const results = await Promise.all(loadPromises);

        // Check if all samples loaded successfully
        if (results.every((result) => result)) {
          this.updateStatus('Audio samples loaded successfully!');
          return;
        }
      } catch (error) {
        console.error(`Sample loading attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          this.updateStatus(
            'Failed to load audio samples. Using synthesized sounds.'
          );
          // Force fallback to synthesized sounds
          this.drumTypes.forEach((type) => {
            this.samples[type] = this.createSynthesizedSound(type);
          });
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  async resumeAudioContext() {
    try {
      // Check if audio context exists and is in a valid state
      if (!this.audioContext) {
        this.updateStatus(
          '❌ Audio context not available. Please refresh the page.'
        );
        return false;
      }

      // Check if we're in a browser environment that allows audio context resume
      if (typeof this.audioContext.resume !== 'function') {
        this.updateStatus(
          '❌ Audio context resume not supported. Please refresh the page.'
        );
        return false;
      }

      // Only resume if suspended
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          this.updateStatus('🎵 Audio resumed successfully!');
          return true;
        } catch (resumeError) {
          console.error('Failed to resume audio context:', resumeError);
          this.updateStatus(
            '❌ Failed to resume audio. Please refresh the page.'
          );
          return false;
        }
      } else if (this.audioContext.state === 'running') {
        // Already running
        return true;
      } else if (this.audioContext.state === 'closed') {
        this.updateStatus('❌ Audio context closed. Please refresh the page.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to resume audio context:', error);
      this.updateStatus('❌ Failed to resume audio. Please refresh the page.');
      return false;
    }
  }

  checkAudioContextHealth() {
    if (!this.audioContext) {
      return false;
    }

    switch (this.audioContext.state) {
      case 'running':
        return true;
      case 'suspended':
        this.updateStatus('Audio suspended. Click anywhere to enable.');
        return false;
      case 'closed':
        this.updateStatus('Audio context closed. Please refresh the page.');
        return false;
      default:
        return false;
    }
  }

  async restoreAudioContext() {
    try {
      if (this.audioContext.state === 'closed') {
        // Create new audio context if the old one is closed
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)({
          latencyHint: 'interactive',
          sampleRate: 44100,
          // Better compatibility for mobile and Linux
          ...(navigator.userAgent.includes('Mobile') && {
            latencyHint: 'balanced',
            sampleRate: 22050
          })
        });

        // Reload samples for the new context
        await this.loadSamplesWithRetry(1);

        this.updateStatus('Audio context restored. Please try again.');
        return true;
      } else if (this.audioContext.state === 'suspended') {
        await this.resumeAudioContext();
        return true;
      }
      return true;
    } catch (error) {
      console.error('Failed to restore audio context:', error);
      this.updateStatus('Failed to restore audio. Please refresh the page.');
      return false;
    }
  }

  // Method to change sound for a specific drum type
  async changeSound(drumType, soundFile) {
    try {
      if (typeof changeSound === 'function') {
        changeSound(drumType, soundFile);

        // Reload the sample
        const audioBuffer = await loadSample(this.audioContext, drumType);
        if (audioBuffer) {
          this.samples[drumType] = audioBuffer;
          this.updateStatus(`${drumType} sound changed successfully`);

          // Refresh the sound selection UI
          this.populateSoundOptions(drumType);
        } else {
          console.error(`Failed to load new ${drumType} sound`);
          this.updateStatus(`Failed to load new ${drumType} sound`);
        }
      }
    } catch (error) {
      console.error(`Failed to change ${drumType} sound:`, error);
      this.updateStatus(`Failed to change ${drumType} sound`);
    }
  }

  // Method to get available sounds for a drum type
  getAvailableSounds(drumType) {
    if (
      typeof SOUND_COLLECTIONS !== 'undefined' &&
      SOUND_COLLECTIONS[drumType]
    ) {
      return SOUND_COLLECTIONS[drumType].options;
    }
    return [];
  }

  // Method to get current sound file for a drum type
  getCurrentSoundFile(drumType) {
    if (typeof getCurrentSoundFile === 'function') {
      return getCurrentSoundFile(drumType);
    }
    return null;
  }

  // Method to reset all sounds to defaults
  async resetAllSounds() {
    try {
      // Reset sound selections to defaults
      if (typeof SOUND_COLLECTIONS !== 'undefined') {
        Object.keys(SOUND_COLLECTIONS).forEach((drumType) => {
          const defaultSound = SOUND_COLLECTIONS[drumType].default;
          if (typeof changeSound === 'function') {
            changeSound(drumType, defaultSound);
          }
        });

        // Reload all samples
        await this.loadSamples();

        // Refresh all sound selection UIs
        this.drumTypes.forEach((drumType) => {
          this.populateSoundOptions(drumType);
        });

        this.updateStatus('All sounds reset to defaults');
      }
    } catch (error) {
      console.error('Failed to reset sounds:', error);
      this.updateStatus('Failed to reset sounds');
    }
  }

  // Method to toggle mute for a specific drum type
  toggleMute(drumType) {
    this.mutedDrums[drumType] = !this.mutedDrums[drumType];
    this.updateMuteButton(drumType);
    this.updateMuteAllButton();
    this.saveMuteState();

    const status = this.mutedDrums[drumType] ? 'muted' : 'unmuted';
    this.updateStatus(`${drumType} ${status}`);
  }

  // Method to mute all drums
  muteAll() {
    this.drumTypes.forEach((drumType) => {
      this.mutedDrums[drumType] = true;
      this.updateMuteButton(drumType);
    });
    this.saveMuteState();
    this.updateMuteAllButton();
    this.updateStatus('All drums muted');
  }

  // Method to unmute all drums
  unmuteAll() {
    this.drumTypes.forEach((drumType) => {
      this.mutedDrums[drumType] = false;
      this.updateMuteButton(drumType);
    });
    this.saveMuteState();
    this.updateMuteAllButton();
    this.updateStatus('All drums unmuted');
  }

  // Method to update mute button appearance
  updateMuteButton(drumType) {
    const muteBtn = document.querySelector(`[data-drum="${drumType}"]`);
    if (muteBtn) {
      if (this.mutedDrums[drumType]) {
        muteBtn.classList.add('muted');
        muteBtn.textContent = '🔇';
        muteBtn.title = `Unmute ${drumType}`;
      } else {
        muteBtn.classList.remove('muted');
        muteBtn.textContent = '🔊';
        muteBtn.title = `Mute ${drumType}`;
      }
    }

    // Update grid row visual state
    this.updateGridRowMuteState(drumType);
  }

  // Method to update grid row mute visual state
  updateGridRowMuteState(drumType) {
    const drumIndex = this.drumTypes.indexOf(drumType);
    const gridRow = document.querySelector(
      `#sequencer-grid .grid-row:nth-child(${drumIndex + 1})`
    );
    if (gridRow) {
      if (this.mutedDrums[drumType]) {
        gridRow.classList.add('muted');
      } else {
        gridRow.classList.remove('muted');
      }
    }
  }

  // Method to update mute all button text
  updateMuteAllButton() {
    const muteAllBtn = document.getElementById('mute-all-btn');
    if (muteAllBtn) {
      if (this.drumTypes.every((drumType) => this.mutedDrums[drumType])) {
        muteAllBtn.textContent = '🔊 Unmute All';
        muteAllBtn.title = 'Unmute all drums';
      } else {
        muteAllBtn.textContent = '🔇 Mute All';
        muteAllBtn.title = 'Mute all drums';
      }
    }
  }

  // Method to save mute state to localStorage
  saveMuteState() {
    try {
      localStorage.setItem(
        'drumMachineMuteState',
        JSON.stringify(this.mutedDrums)
      );
    } catch (error) {
      console.error('Failed to save mute state:', error);
    }
  }

  // Method to load mute state from localStorage
  loadMuteState() {
    try {
      const saved = localStorage.getItem('drumMachineMuteState');
      if (saved) {
        const savedMuteState = JSON.parse(saved);
        // Merge with current drum types (in case new types were added)
        this.drumTypes.forEach((drumType) => {
          if (Object.prototype.hasOwnProperty.call(savedMuteState, drumType)) {
            this.mutedDrums[drumType] = savedMuteState[drumType];
          }
        });
      }
    } catch (error) {
      console.error('Failed to load mute state:', error);
    }
  }

  // Method to initialize mute buttons with current state
  initMuteButtons() {
    this.drumTypes.forEach((drumType) => {
      this.updateMuteButton(drumType);
    });
    this.updateMuteAllButton(); // Initialize the mute all button
  }

  createSynthesizedSound(type) {
    const sampleRate = this.audioContext.sampleRate;
    let duration, buffer, data;

    switch (type) {
      case 'kick':
        // Deep, punchy kick with sub-bass and click
        duration = 0.15;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // Sub-bass fundamental
          const fundamental = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t * 8);
          // Higher click component
          const click = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 50);
          // Noise component for attack
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 100);

          data[i] = (fundamental * 0.6 + click * 0.3 + noise * 0.1) * 0.8;
        }
        break;

      case 'snare':
        // Bright, snappy snare with body and sizzle
        duration = 0.2;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // Body tone
          const body = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 4);
          // Higher harmonics
          const harmonics = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 6);
          // White noise for sizzle
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 8);
          // Ring modulation
          const ring = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 3);

          data[i] =
            (body * 0.4 + harmonics * 0.3 + noise * 0.2 + ring * 0.1) * 0.7;
        }
        break;

      case 'hihat':
        // Crisp, bright hi-hat with metallic character
        duration = 0.1;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // High frequency content
          const high1 = Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t * 30);
          const high2 = Math.sin(2 * Math.PI * 12000 * t) * Math.exp(-t * 25);
          // Noise for air
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 40);
          // Metallic ring
          const metallic = Math.sin(2 * Math.PI * 6000 * t) * Math.exp(-t * 15);

          data[i] =
            (high1 * 0.3 + high2 * 0.3 + noise * 0.3 + metallic * 0.1) * 0.6;
        }
        break;

      case 'crash':
        // Explosive crash with long decay
        duration = 0.8;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // Multiple frequencies for complexity
          const freq1 = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 2);
          const freq2 = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 1.5);
          const freq3 = Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 1.8);
          // Noise for impact
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 3);

          data[i] =
            (freq1 * 0.3 + freq2 * 0.3 + freq3 * 0.2 + noise * 0.2) * 0.5;
        }
        break;

      case 'tom1':
        // Mid-tom with warm tone
        duration = 0.3;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const fundamental =
            Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 3);
          const overtone = Math.sin(2 * Math.PI * 240 * t) * Math.exp(-t * 4);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 10);

          data[i] = (fundamental * 0.6 + overtone * 0.3 + noise * 0.1) * 0.7;
        }
        break;

      case 'tom2':
        // High-tom with bright attack
        duration = 0.25;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const fundamental =
            Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 4);
          const overtone = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 5);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);

          data[i] = (fundamental * 0.6 + overtone * 0.3 + noise * 0.1) * 0.7;
        }
        break;

      case 'ride':
        // Metallic ride with ping and wash
        duration = 0.6;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          const ping = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 2);
          const wash = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 1.5);
          const metallic =
            Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 2.5);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 4);

          data[i] =
            (ping * 0.4 + wash * 0.3 + metallic * 0.2 + noise * 0.1) * 0.6;
        }
        break;

      case 'clap':
        // Sharp clap with stereo spread simulation
        duration = 0.15;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
          const t = i / sampleRate;
          // Sharp attack
          const attack = (Math.random() * 2 - 1) * Math.exp(-t * 80);
          // Body tone
          const body = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 6);
          // High frequency content
          const high = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 8);
          // Decay noise
          const decay = (Math.random() * 2 - 1) * Math.exp(-t * 15);

          data[i] =
            (attack * 0.4 + body * 0.3 + high * 0.2 + decay * 0.1) * 0.7;
        }
        break;

      default:
        duration = 0.1;
        buffer = this.audioContext.createBuffer(
          1,
          sampleRate * duration,
          sampleRate
        );
        data = buffer.getChannelData(0);
        data.fill(0);
    }

    return buffer;
  }

  initSequencer() {
    this.sequencer = {};
    this.drumTypes.forEach((type) => {
      this.sequencer[type] = new Array(this.patternLength).fill(false);
    });
  }

  initUI() {
    // Generate sequencer grid
    this.generateGrid();

    // Initialize sound selection UI
    this.initSoundSelection();

    // Event listeners
    this.bindEvents();

    // Global audio context resume handler for better cross-platform support
    const resumeAudioOnInteraction = async (event) => {
      try {
        // Skip if clicking on piano header (just UI toggle)
        if (event.target.closest('#piano-header')) {
          return;
        }

        // Check if audio context exists and is in a valid state
        if (!this.audioContext) {
          console.warn('Audio context not available during interaction');
          return;
        }

        // Only proceed if suspended
        if (this.audioContext.state === 'suspended') {
          const resumed = await this.resumeAudioContext();
          if (resumed) {
            this.updateStatus('🎵 Audio enabled! Loading piano samples...');

            // Load piano samples after audio context is resumed
            await this.loadPianoSamples();

            this.updateStatus('🎵 Audio enabled! Ready to create beats.');

            // Remove the global handler once audio is resumed
            document.removeEventListener('click', resumeAudioOnInteraction);
            document.removeEventListener(
              'touchstart',
              resumeAudioOnInteraction
            );
            document.removeEventListener('keydown', resumeAudioOnInteraction);
          }
        } else if (this.audioContext.state === 'running') {
          // Audio already running, just load piano samples if needed
          if (Object.keys(this.pianoSamples).length === 0) {
            this.updateStatus('🎵 Loading piano samples...');
            await this.loadPianoSamples();
            this.updateStatus('🎵 Ready to create beats!');
          }
        }
      } catch (error) {
        console.error('Failed to resume audio on interaction:', error);
        this.updateStatus('Failed to enable audio. Please refresh the page.');
      }
    };

    // Add multiple event listeners for better mobile/Linux support
    document.addEventListener('click', resumeAudioOnInteraction);
    document.addEventListener('touchstart', resumeAudioOnInteraction);
    document.addEventListener('keydown', resumeAudioOnInteraction);
  }

  initSoundSelection() {
    // Populate sound selection UI for each drum type
    this.drumTypes.forEach((drumType) => {
      this.populateSoundOptions(drumType);
    });
  }

  populateSoundOptions(drumType) {
    const container = document.getElementById(`${drumType}-sounds`);
    if (!container) {
      console.warn(`Container not found for ${drumType} sounds`);
      return;
    }

    const availableSounds = this.getAvailableSounds(drumType);
    const currentSound = this.getCurrentSoundFile(drumType);

    container.innerHTML = '';

    availableSounds.forEach((sound) => {
      const option = document.createElement('div');
      option.className = 'sound-option';
      option.textContent = sound.name;

      // Mark current selection
      if (sound.file === currentSound) {
        option.classList.add('current');
      }

      // Add click event to change sound
      option.addEventListener('click', async () => {
        // Remove current class from all options
        container.querySelectorAll('.sound-option').forEach((opt) => {
          opt.classList.remove('current');
        });

        // Add current class to clicked option
        option.classList.add('current');

        // Change the sound
        await this.changeSound(drumType, sound.file);
      });

      container.appendChild(option);
    });
  }

  generateGrid() {
    const grid = document.getElementById('sequencer-grid');
    grid.innerHTML = '';

    // Create grid rows
    this.drumTypes.forEach((drumType, rowIndex) => {
      const row = document.createElement('div');
      row.className = 'grid-row';
      row.style.gridTemplateColumns = `repeat(${this.patternLength}, 1fr)`;

      // Create grid cells
      for (let step = 0; step < this.patternLength; step++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = rowIndex;
        cell.dataset.step = step;
        cell.dataset.drum = drumType;

        // Add click event
        cell.addEventListener('click', () => this.toggleStep(rowIndex, step));

        row.appendChild(cell);
      }

      grid.appendChild(row);
    });
  }

  bindEvents() {
    // Play button
    document
      .getElementById('play-btn')
      .addEventListener('click', () => this.togglePlay());

    // Stop button
    document
      .getElementById('stop-btn')
      .addEventListener('click', () => this.stop());

    // Clear button
    document
      .getElementById('clear-btn')
      .addEventListener('click', () => this.clearPattern());

    // Tempo control
    document.getElementById('tempo').addEventListener('input', (e) => {
      this.tempo = parseInt(e.target.value);
      document.getElementById('tempo-display').textContent = this.tempo;
    });

    // Pattern length control
    document
      .getElementById('pattern-length')
      .addEventListener('change', (e) => {
        this.patternLength = parseInt(e.target.value);
        this.initSequencer();
        this.generateGrid();
        this.updateGridDisplay(); // Update the display after changing pattern length
      });

    // Drum pad buttons
    document.querySelectorAll('.drum-pad').forEach((pad) => {
      pad.addEventListener('click', () => this.playSound(pad.dataset.sound));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Share button
    document
      .getElementById('share-btn')
      .addEventListener('click', () => this.shareBeat());

    // Load button
    document
      .getElementById('load-btn')
      .addEventListener('click', () => this.loadBeat());

    // Load from URL button
    document
      .getElementById('load-url-btn')
      .addEventListener('click', () => this.loadBeatFromURL());

    // Save local button
    document
      .getElementById('save-local-btn')
      .addEventListener('click', () => this.saveToLocalStorage());

    // Theme toggle
    document
      .getElementById('theme-toggle')
      .addEventListener('click', () => this.toggleTheme());

    // Reset sounds button
    document
      .getElementById('reset-sounds-btn')
      .addEventListener('click', () => this.resetAllSounds());

    // Mute all button
    document.getElementById('mute-all-btn').addEventListener('click', () => {
      if (this.drumTypes.every((drumType) => this.mutedDrums[drumType])) {
        this.unmuteAll();
      } else {
        this.muteAll();
      }
    });

    // Individual mute buttons
    document.querySelectorAll('.mute-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const drumType = btn.dataset.drum;
        this.toggleMute(drumType);
      });
    });

    // Record button
    document.getElementById('record-btn').addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    // Sound selection section header for collapsible functionality
    const soundSelectionHeader = document.getElementById(
      'sound-selection-header'
    );
    if (soundSelectionHeader) {
      soundSelectionHeader.addEventListener('click', () => {
        const soundContent = document.querySelector('.sound-content');
        const expandIcon = soundSelectionHeader.querySelector('.expand-icon');

        if (soundContent.classList.contains('collapsed')) {
          // Expand
          soundContent.classList.remove('collapsed');
          expandIcon.classList.add('expanded');
          expandIcon.textContent = '🔽';
        } else {
          // Collapse
          soundContent.classList.add('collapsed');
          expandIcon.classList.remove('expanded');
          expandIcon.textContent = '▶️';
        }
      });
    }

    // Piano section header for collapsible functionality
    const pianoHeader = document.getElementById('piano-header');
    if (pianoHeader) {
      pianoHeader.addEventListener('click', (event) => {
        // Prevent this click from bubbling up to global handlers
        event.stopPropagation();

        const pianoContent = document.querySelector('.piano-content');
        const expandIcon = pianoHeader.querySelector('.expand-icon');

        if (pianoContent.classList.contains('collapsed')) {
          // Expand
          pianoContent.classList.remove('collapsed');
          expandIcon.classList.add('expanded');
          expandIcon.textContent = '🔽';
        } else {
          // Collapse
          pianoContent.classList.add('collapsed');
          expandIcon.textContent = '▶️';
        }
      });
    }
  }

  handleKeyPress(e) {
    if (e.repeat) return;

    const keyMap = {
      1: 'kick',
      2: 'snare',
      3: 'hihat',
      4: 'crash',
      5: 'tom1',
      6: 'tom2',
      7: 'ride',
      8: 'clap',
      9: 'bass',
      ' ': 'play', // Spacebar
      c: 'clear' // C key
    };

    const action = keyMap[e.key];
    if (action) {
      e.preventDefault();

      if (action === 'play') {
        this.togglePlay();
      } else if (action === 'clear') {
        this.clearPattern();
      } else {
        this.playSound(action);
      }
    }
  }

  toggleStep(rowIndex, step) {
    const drumType = this.drumTypes[rowIndex];
    this.sequencer[drumType][step] = !this.sequencer[drumType][step];

    const cell = document.querySelector(
      `[data-row="${rowIndex}"][data-step="${step}"]`
    );
    cell.classList.toggle('active', this.sequencer[drumType][step]);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    document.getElementById('play-btn').textContent = '⏸️ Pause';
    document.getElementById('play-btn').classList.add('btn-primary');

    this.updateStatus('Playing...');
    this.playStep();
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    document.getElementById('play-btn').textContent = '▶️ Play';
    document.getElementById('play-btn').classList.remove('btn-primary');

    // Clear current step highlighting
    document.querySelectorAll('.grid-cell.current').forEach((cell) => {
      cell.classList.remove('current');
    });

    this.updateStatus('Stopped');
  }

  async playStep() {
    if (!this.isPlaying) return;

    // Check audio context health before playing
    if (this.audioContext.state === 'closed') {
      // Stop playback if audio context is closed
      this.stop();
      this.updateStatus('Audio context closed. Please refresh the page.');
      return;
    }

    // Resume audio context if suspended (allowed after user interaction)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.resumeAudioContext();
      } catch (error) {
        // Stop playback if we can't resume audio
        this.stop();
        this.updateStatus(
          'Failed to resume audio. Please click anywhere to enable.'
        );
        return;
      }
    }

    // Clear previous current step
    document.querySelectorAll('.grid-cell.current').forEach((cell) => {
      cell.classList.remove('current');
    });

    // Highlight current step
    this.drumTypes.forEach((drumType, rowIndex) => {
      const cell = document.querySelector(
        `[data-row="${rowIndex}"][data-step="${this.currentStep}"]`
      );
      if (cell) {
        cell.classList.add('current');
      }
    });

    // Play sounds for current step
    this.drumTypes.forEach((drumType) => {
      if (
        this.sequencer[drumType][this.currentStep] &&
        !this.mutedDrums[drumType]
      ) {
        this.playSound(drumType);
      }
    });

    // Move to next step
    this.currentStep = (this.currentStep + 1) % this.patternLength;

    // Schedule next step with better timing
    const stepTime = ((60 / this.tempo) * 4) / this.patternLength;

    // Use more precise timing for better cross-platform compatibility
    try {
      setTimeout(() => this.playStep(), stepTime * 1000);
    } catch (error) {
      console.error('Error scheduling next step:', error);
      // Fallback to immediate execution if scheduling fails
      this.playStep();
    }
  }

  async playSound(drumType) {
    if (!this.samples[drumType] || this.mutedDrums[drumType]) return;

    try {
      // Check if audio context is in error state
      if (this.audioContext.state === 'closed') {
        console.error('Audio context is closed');
        this.updateStatus('Audio context error. Please refresh the page.');
        return;
      }

      // Resume audio context if suspended (this is allowed after user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.resumeAudioContext();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.samples[drumType];
      source.connect(gainNode);

      // Route audio to both speakers and recording destination (if recording)
      if (this.isRecording && this.recordingDestination) {
        gainNode.connect(this.recordingDestination);
      }
      gainNode.connect(this.audioContext.destination);

      // Add some variation to make it sound more natural
      gainNode.gain.value = 0.7 + Math.random() * 0.3;

      // Add error handling for source start
      source.onerror = (error) => {
        console.error('Audio source error:', error);
        this.updateStatus('Audio playback error. Please try again.');
      };

      source.start();

      // Record the drum hit if recording is active
      this.recordDrumHit(drumType);
    } catch (error) {
      console.error('Error playing sound:', error);

      // Try to recover audio context
      if (this.audioContext.state === 'suspended') {
        this.updateStatus('Audio suspended. Click anywhere to enable.');
      } else {
        this.updateStatus('Audio error. Please refresh the page.');
      }
    }
  }

  // Recording functionality
  async startRecording() {
    if (this.isRecording) return;

    try {
      this.isRecording = true;
      this.recordingBuffer = [];
      this.recordingStartTime = Date.now();
      this.audioChunks = [];

      // Create a MediaStreamDestination to capture audio output
      this.recordingDestination =
        this.audioContext.createMediaStreamDestination();

      // Create MediaRecorder to capture the audio stream
      this.mediaRecorder = new MediaRecorder(this.recordingDestination.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Collect audio chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Update UI
      const recordBtn = document.getElementById('record-btn');
      recordBtn.textContent = '⏹️ Stop Recording';
      recordBtn.classList.remove('btn-danger');
      recordBtn.classList.add('btn-warning');

      // Add recording indicator to status
      const statusText = document.getElementById('status-text');
      statusText.innerHTML =
        '<span style="color: #ff6b6b; animation: pulse 1s infinite;">🔴 Recording...</span> Play the sequencer or use drum pads to record the actual sounds';

      // Start updating recording duration
      this.recordingInterval = setInterval(() => {
        if (this.isRecording) {
          const duration = (Date.now() - this.recordingStartTime) / 1000;
          const durationSpan = statusText.querySelector('span');
          if (durationSpan) {
            durationSpan.textContent = `🔴 Recording... ${duration.toFixed(1)}s`;
          }
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.updateStatus('Failed to start recording audio output.');
    }
  }

  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    const recordingDuration = Date.now() - this.recordingStartTime;

    // Clear recording interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Stop MediaRecorder and get final data
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      // Wait for final data and save
      this.mediaRecorder.onstop = () => {
        if (this.audioChunks.length > 0) {
          this.saveRecording();
          this.updateStatus(
            `Recording saved! Duration: ${(recordingDuration / 1000).toFixed(1)}s`
          );
        } else {
          this.updateStatus('No recording data to save');
        }
      };
    }

    // Update UI
    const recordBtn = document.getElementById('record-btn');
    recordBtn.textContent = '🔴 Record';
    recordBtn.classList.remove('btn-warning');
    recordBtn.classList.add('btn-danger');

    // Stop all tracks in the stream
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
  }

  async saveRecording() {
    try {
      // Create blob from audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

      // Convert to WAV format
      const wavBlob = await this.convertToWav(audioBlob);

      // Create download link
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drum-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save recording:', error);
      this.updateStatus('Failed to save recording');
    }
  }

  async convertToWav(audioBlob) {
    try {
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Decode the audio data
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Convert to WAV format
      const wavBuffer = this.audioBufferToWav(audioBuffer);

      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Failed to convert to WAV:', error);
      // Fallback: return original blob if conversion fails
      return audioBlob;
    }
  }

  audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV file header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const writeUint32 = (offset, value) => {
      view.setUint32(offset, value, true);
    };

    const writeUint16 = (offset, value) => {
      view.setUint16(offset, value, true);
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    writeUint32(4, 36 + length * numberOfChannels * 2);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    writeUint32(16, 16);
    writeUint16(20, 1);
    writeUint16(22, numberOfChannels);
    writeUint32(24, sampleRate);
    writeUint32(28, sampleRate * numberOfChannels * 2);
    writeUint16(32, numberOfChannels * 2);
    writeUint16(34, 16);

    // data sub-chunk
    writeString(36, 'data');
    writeUint32(40, length * numberOfChannels * 2);

    // Convert audio data to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i])
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }
    }

    return arrayBuffer;
  }

  recordDrumHit(drumType) {
    if (!this.isRecording) return;

    const timestamp = Date.now() - this.recordingStartTime;
    this.recordingBuffer.push({
      drumType,
      timestamp,
      step: Math.floor(
        (timestamp / 1000) * (this.tempo / 60) * (this.patternLength / 16)
      )
    });
  }

  updateGridDisplay() {
    this.drumTypes.forEach((drumType, rowIndex) => {
      this.sequencer[drumType].forEach((isActive, step) => {
        const cell = document.querySelector(
          `[data-row="${rowIndex}"][data-step="${step}"]`
        );
        if (cell) {
          cell.classList.toggle('active', isActive);
        }
      });
    });
  }

  clearPattern() {
    this.initSequencer();
    this.updateGridDisplay();
    this.updateStatus('Pattern cleared');
  }

  shareBeat() {
    try {
      // Create optimized beat data with only non-default values
      const optimizedBeatData = this.createOptimizedBeatData();

      // Always include at least an empty sequencer to ensure the URL is valid
      if (!optimizedBeatData.sequencer) {
        optimizedBeatData.sequencer = {};
      }

      const encoded = btoa(JSON.stringify(optimizedBeatData));
      const url = `${window.location.origin}${window.location.pathname}?beat=${encoded}`;

      console.log('Sharing beat URL:', url); // Debug log
      console.log('Optimized beat data:', optimizedBeatData); // Debug log

      // Copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(() => {
            this.updateStatus('Beat URL copied to clipboard!');
          })
          .catch((error) => {
            console.error('Clipboard API failed:', error);
            // Fallback for older browsers
            this.fallbackCopyToClipboard(url);
          });
      } else {
        // Fallback for older browsers
        this.fallbackCopyToClipboard(url);
      }
    } catch (error) {
      console.error('Error in shareBeat:', error);
      this.updateStatus('Error creating share URL');
    }
  }

  fallbackCopyToClipboard(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        this.updateStatus('Beat URL copied to clipboard!');
      } else {
        this.updateStatus('Failed to copy URL. Please copy manually: ' + text);
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.updateStatus('Failed to copy URL. Please copy manually: ' + text);
    }
  }

  createOptimizedBeatData() {
    const optimizedData = {};

    // Only include tempo if it's different from default (120)
    if (this.tempo !== 120) {
      optimizedData.tempo = this.tempo;
    }

    // Only include pattern length if it's different from default (16)
    if (this.patternLength !== 16) {
      optimizedData.patternLength = this.patternLength;
    }

    // Only include sequencer data for drums that have non-false values
    const optimizedSequencer = {};
    this.drumTypes.forEach((drumType) => {
      const pattern = this.sequencer[drumType];
      const hasTrueValues = pattern.some((step) => step === true);

      if (hasTrueValues) {
        // Only include the true values with their positions
        const trueSteps = [];
        pattern.forEach((step, index) => {
          if (step === true) {
            trueSteps.push(index);
          }
        });
        optimizedSequencer[drumType] = trueSteps;
      }
    });

    // Only include sequencer if there are any true values
    if (Object.keys(optimizedSequencer).length > 0) {
      optimizedData.sequencer = optimizedSequencer;
    }

    return optimizedData;
  }

  loadBeat() {
    // Load from local storage instead of prompting for URL
    this.loadFromLocalStorage();
  }

  loadBeatFromURL() {
    const url = prompt('Paste the beat URL here:');
    if (url) {
      try {
        const urlObj = new URL(url);
        const beatParam = urlObj.searchParams.get('beat');
        if (beatParam) {
          const decoded = JSON.parse(atob(beatParam));
          this.loadBeatData(decoded);
          this.updateStatus('Beat loaded successfully from URL!');
        }
      } catch (error) {
        this.updateStatus('Invalid beat URL');
      }
    }
  }

  loadBeatData(data) {
    // Handle optimized sequencer data (only true values) or legacy format (full arrays)
    if (data.sequencer) {
      // Ensure all current drum types exist in the loaded sequencer
      this.drumTypes.forEach((drumType) => {
        if (!data.sequencer[drumType]) {
          // Initialize with all false values
          this.sequencer[drumType] = new Array(this.patternLength).fill(false);
        } else if (Array.isArray(data.sequencer[drumType])) {
          // Check if this is optimized format (array of step indices) or legacy format (array of booleans)
          if (
            data.sequencer[drumType].length > 0 &&
            typeof data.sequencer[drumType][0] === 'number'
          ) {
            // Optimized format: array of step indices where drum hits occur
            const optimizedPattern = new Array(this.patternLength).fill(false);
            data.sequencer[drumType].forEach((stepIndex) => {
              if (stepIndex >= 0 && stepIndex < this.patternLength) {
                optimizedPattern[stepIndex] = true;
              }
            });
            this.sequencer[drumType] = optimizedPattern;
          } else {
            // Legacy format: array of booleans
            this.sequencer[drumType] = data.sequencer[drumType];
          }
        }
      });
    }

    // Load tempo (default to 120 if not specified)
    if (data.tempo !== undefined) {
      this.tempo = data.tempo;
      document.getElementById('tempo').value = this.tempo;
      document.getElementById('tempo-display').textContent = this.tempo;
    }

    // Load pattern length (default to 16 if not specified)
    if (data.patternLength !== undefined) {
      this.patternLength = data.patternLength;
      document.getElementById('pattern-length').value = this.patternLength;
      this.generateGrid();
    }

    this.updateGridDisplay();

    // Update last used timestamp for this beat if it's from local storage
    if (data.name && data.timestamp) {
      this.updateBeatLastUsed(data.name);
    }
  }

  updateBeatLastUsed(beatName) {
    try {
      const storedBeats = this.getStoredBeats();
      const beatIndex = storedBeats.findIndex((beat) => beat.name === beatName);

      if (beatIndex !== -1) {
        // Update the last used timestamp
        storedBeats[beatIndex].lastUsed = Date.now();
        localStorage.setItem('drumMachineBeats', JSON.stringify(storedBeats));
      }
    } catch (error) {
      console.error('Failed to update beat last used timestamp:', error);
    }
  }

  loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const beatParam = urlParams.get('beat');

    if (beatParam) {
      try {
        const decoded = JSON.parse(atob(beatParam));
        this.loadBeatData(decoded);
        this.updateStatus('Beat loaded from shared URL');
      } catch (error) {
        // Silent error handling
      }
    }
  }

  saveToLocalStorage() {
    // Get beat name from user
    const beatName = prompt('Enter a name for this beat:');
    if (!beatName || beatName.trim() === '') {
      this.updateStatus('Beat name is required');
      return;
    }

    // Use the same optimized format for local storage
    const beatData = this.createOptimizedBeatData();
    beatData.name = beatName.trim();
    beatData.timestamp = Date.now();
    beatData.date = new Date().toISOString();

    // Get existing beats
    const existingBeats = this.getStoredBeats();

    // Check if name already exists
    const existingIndex = existingBeats.findIndex(
      (beat) => beat.name === beatData.name
    );
    if (existingIndex !== -1) {
      const overwrite = confirm(
        `A beat named "${beatData.name}" already exists. Do you want to overwrite it?`
      );
      if (!overwrite) {
        this.updateStatus('Save cancelled');
        return;
      }
      // Replace existing beat
      existingBeats[existingIndex] = beatData;
    } else {
      // Add new beat
      existingBeats.push(beatData);
    }

    // Save updated beats list
    localStorage.setItem('drumMachineBeats', JSON.stringify(existingBeats));
    this.updateStatus(`Beat "${beatData.name}" saved successfully!`);

    // Update the load button to show beat count
    this.updateLoadButtonText();
  }

  getStoredBeats() {
    try {
      const stored = localStorage.getItem('drumMachineBeats');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored beats:', error);
      return [];
    }
  }

  loadLastUsedBeat() {
    const storedBeats = this.getStoredBeats();

    if (storedBeats.length === 0) {
      // No saved beats - just continue with default
      return;
    }

    // Find the most recently used beat (highest lastUsed timestamp, fallback to creation timestamp)
    const lastUsedBeat = storedBeats.reduce((latest, current) => {
      const currentLastUsed = current.lastUsed || current.timestamp || 0;
      const latestLastUsed = latest.lastUsed || latest.timestamp || 0;
      return currentLastUsed > latestLastUsed ? current : latest;
    });

    if (lastUsedBeat) {
      // Load the last used beat silently during initialization
      this.loadBeatData(lastUsedBeat);
      // Don't show status message during initialization
    }
  }

  loadFromLocalStorage() {
    const storedBeats = this.getStoredBeats();

    if (storedBeats.length === 0) {
      this.updateStatus('No saved beats found');
      return;
    }

    // Create beat selection dialog
    this.showBeatSelectionDialog(storedBeats);
  }

  showBeatSelectionDialog(beats) {
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'beat-selection-modal';
    modal.innerHTML = `
      <div class="beat-selection-content">
        <h3>Select a Beat to Load</h3>
        <div class="beat-list">
          ${beats
            .map(
              (beat, index) => `
            <div class="beat-item" data-index="${index}">
              <div class="beat-info">
                <div class="beat-name">${beat.name}</div>
                <div class="beat-date">${new Date(beat.date).toLocaleString()}</div>
                <div class="beat-details">
                  ${beat.tempo ? `Tempo: ${beat.tempo} BPM` : 'Default tempo (120 BPM)'} | 
                  ${beat.patternLength ? `${beat.patternLength} steps` : 'Default 16 steps'} |
                  ${beat.sequencer ? `${Object.keys(beat.sequencer).length} drum tracks` : 'Empty pattern'}
                </div>
              </div>
              <div class="beat-actions">
                <button class="btn btn-small btn-primary load-beat-btn">Load</button>
                <button class="btn btn-small btn-danger delete-beat-btn">Delete</button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="beat-selection-footer">
          <button class="btn btn-secondary" id="cancel-load-btn">Cancel</button>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.appendChild(modal);

    // Add event listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeBeatSelectionDialog();
      }
    });

    // Load beat buttons
    modal.querySelectorAll('.load-beat-btn').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.loadBeatData(beats[index]);
        this.updateStatus(`Beat "${beats[index].name}" loaded successfully!`);
        this.closeBeatSelectionDialog();
      });
    });

    // Delete beat buttons
    modal.querySelectorAll('.delete-beat-btn').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const beatName = beats[index].name;
        if (confirm(`Are you sure you want to delete "${beatName}"?`)) {
          this.deleteStoredBeat(index);
          this.closeBeatSelectionDialog();
        }
      });
    });

    // Cancel button
    modal.querySelector('#cancel-load-btn').addEventListener('click', () => {
      this.closeBeatSelectionDialog();
    });
  }

  closeBeatSelectionDialog() {
    const modal = document.querySelector('.beat-selection-modal');
    if (modal) {
      modal.remove();
    }
  }

  deleteStoredBeat(index) {
    const storedBeats = this.getStoredBeats();
    const deletedBeat = storedBeats[index];

    storedBeats.splice(index, 1);
    localStorage.setItem('drumMachineBeats', JSON.stringify(storedBeats));

    this.updateStatus(`Beat "${deletedBeat.name}" deleted successfully!`);
    this.updateLoadButtonText();
  }

  updateLoadButtonText() {
    const loadBtn = document.getElementById('load-btn');
    const storedBeats = this.getStoredBeats();
    const count = storedBeats.length;

    if (count === 0) {
      loadBtn.textContent = '📥 Load Beat';
    } else {
      loadBtn.textContent = `📥 Load Beat (${count})`;
    }
  }

  updateStatus(message) {
    document.getElementById('status-text').textContent = message;
  }

  toggleTheme() {
    try {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('drumMachineTheme', newTheme);

      // Update theme toggle button icon
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
      }
    } catch (error) {
      // Silent error handling
    }
  }

  loadTheme() {
    try {
      const savedTheme = localStorage.getItem('drumMachineTheme');

      if (savedTheme) {
        // User has explicitly chosen a theme, use it
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        // No saved theme, detect system preference
        const systemPrefersDark =
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        const autoTheme = systemPrefersDark ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', autoTheme);

        // Save the auto-detected theme so user can override it
        localStorage.setItem('drumMachineTheme', autoTheme);
      }

      // Update theme toggle button icon
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`;
      }

      // Listen for system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          // Only auto-update if user hasn't manually set a theme
          if (!localStorage.getItem('drumMachineTheme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('drumMachineTheme', newTheme);

            // Update button
            if (themeToggle) {
              themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
              themeToggle.title = `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
            }
          }
        });
      }
    } catch (error) {
      // Silent error handling
    }
  }

  // Piano functionality
  initPiano() {
    this.pianoSamples = {};
    // Don't load piano samples until user interaction (audio context is resumed)
    this.createPianoKeys();
    this.bindPianoEvents();
  }

  async loadPianoSamples() {
    try {
      this.updateStatus('🎹 Loading piano samples...');

      // Wait a bit for the server to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear any existing samples to ensure clean loading
      this.pianoSamples = {};

      for (let i = 1; i <= 24; i++) {
        const keyNum = i.toString().padStart(2, '0');
        const audioBuffer = await this.loadPianoSampleWithRetry(
          `sounds/piano/key${keyNum}.mp3`,
          3
        );
        if (audioBuffer) {
          this.pianoSamples[i] = audioBuffer;
          // Update status to show progress
          if (i % 6 === 0) {
            // Update every 6 keys
            this.updateStatus(`🎹 Loading piano samples... ${i}/24 loaded`);
          }
        } else {
          console.warn(`Failed to load piano key ${i}: key${keyNum}.mp3`);
          // Mark as failed to load so we can use synthesized fallback
          this.pianoSamples[i] = null;
        }
      }
      const loadedCount = Object.keys(this.pianoSamples).length;

      if (loadedCount === 0) {
        this.updateStatus(
          '⚠️ Piano samples failed to load. Creating synthesized piano sounds...'
        );
        // Create synthesized piano sounds as fallback
        await this.createSynthesizedPianoSounds();
      } else {
        this.updateStatus(`🎹 Piano ready with ${loadedCount} keys!`);

        // Verify all keys have proper samples
        const missingKeys = [];
        for (let i = 1; i <= 24; i++) {
          if (!this.pianoSamples[i]) {
            missingKeys.push(i);
          }
        }

        if (missingKeys.length > 0) {
          console.warn(
            `Piano keys with missing samples: ${missingKeys.join(', ')}`
          );
          this.updateStatus(
            `🎹 Piano ready! ${loadedCount}/24 keys loaded (${missingKeys.length} using synthesized sounds)`
          );
        }
      }
    } catch (error) {
      console.error('Failed to load piano samples:', error);
      this.updateStatus('⚠️ Failed to load piano samples');
    }
  }

  async loadPianoSampleWithRetry(filePath, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const audioBuffer = await this.loadPianoSample(filePath);
        if (audioBuffer) {
          return audioBuffer;
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }
    return null;
  }

  async loadPianoSample(filePath) {
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
      }
      return null;
    } catch (error) {
      console.error(`Error loading piano sample ${filePath}:`, error);
      return null;
    }
  }

  async createSynthesizedPianoSounds() {
    try {
      // Create synthesized piano sounds for all 24 keys
      for (let i = 1; i <= 24; i++) {
        const frequency = this.getPianoFrequency(i);
        const audioBuffer = this.createSynthesizedPianoSound(frequency);
        this.pianoSamples[i] = audioBuffer;
      }
      this.updateStatus('🎹 Piano ready with synthesized sounds!');
      console.log('Created synthesized piano sounds for all keys');
    } catch (error) {
      console.error('Failed to create synthesized piano sounds:', error);
      this.updateStatus('⚠️ Piano not available');
    }
  }

  getPianoFrequency(keyIndex) {
    // Piano frequency mapping (A4 = 440Hz)
    const baseFrequencies = [
      261.63,
      277.18,
      293.66,
      311.13,
      329.63,
      349.23,
      369.99,
      392.0, // C4 to C5
      415.3,
      440.0,
      466.16,
      493.88,
      523.25,
      554.37,
      587.33,
      622.25, // C#5 to D#6
      659.25,
      698.46,
      739.99,
      783.99,
      830.61,
      880.0,
      932.33,
      987.77 // E6 to B6
    ];
    return baseFrequencies[keyIndex - 1] || 440;
  }

  createSynthesizedPianoSound(frequency) {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 0.5 seconds
    const frameCount = sampleRate * duration;

    const audioBuffer = this.audioContext.createBuffer(
      1,
      frameCount,
      sampleRate
    );
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const time = i / sampleRate;
      const envelope = Math.exp(-time * 3); // Exponential decay
      const wave = Math.sin(2 * Math.PI * frequency * time);
      channelData[i] = wave * envelope * 0.3; // Reduce volume
    }

    return audioBuffer;
  }

  getWhiteKeyIndexForBlackKey(blackKeyIndex) {
    // Map black key indices to the white key they should be positioned between
    const blackToWhiteMap = {
      2: 0, // C# goes between C (index 0) and D (index 1)
      4: 1, // D# goes between D (index 1) and E (index 2)
      7: 3, // F# goes between F (index 3) and G (index 4)
      9: 4, // G# goes between G (index 4) and A (index 5)
      11: 5, // A# goes between A (index 5) and B (index 6)
      14: 7, // C# (second octave) goes between C (index 7) and D (index 8)
      16: 8, // D# (second octave) goes between D (index 8) and E (index 9)
      19: 10, // F# (second octave) goes between F (index 10) and G (index 11)
      21: 11, // G# (second octave) goes between G (index 11) and A (index 12)
      23: 12 // A# (second octave) goes between A (index 12) and B (index 13)
    };
    return blackToWhiteMap[blackKeyIndex] || 0;
  }

  createPianoKeys() {
    const pianoKeysContainer = document.getElementById('piano-keys');
    if (!pianoKeysContainer) return;

    // Clear any existing keys
    pianoKeysContainer.innerHTML = '';

    // Piano key mapping: 24 keys (2 octaves) - keys follow piano order left to right
    const keyMap = [
      { note: 'C', key: 'Q', type: 'white', index: 1 },
      { note: 'C#', key: 'A', type: 'black', index: 2 },
      { note: 'D', key: 'W', type: 'white', index: 3 },
      { note: 'D#', key: 'S', type: 'black', index: 4 },
      { note: 'E', key: 'E', type: 'white', index: 5 },
      { note: 'F', key: 'R', type: 'white', index: 6 },
      { note: 'F#', key: 'D', type: 'black', index: 7 },
      { note: 'G', key: 'T', type: 'white', index: 8 },
      { note: 'G#', key: 'F', type: 'black', index: 9 },
      { note: 'A', key: 'Y', type: 'white', index: 10 },
      { note: 'A#', key: 'G', type: 'black', index: 11 },
      { note: 'B', key: 'U', type: 'white', index: 12 },
      { note: 'C', key: 'I', type: 'white', index: 13 },
      { note: 'C#', key: 'J', type: 'black', index: 14 },
      { note: 'D', key: 'O', type: 'white', index: 15 },
      { note: 'D#', key: 'K', type: 'black', index: 16 },
      { note: 'E', key: 'P', type: 'white', index: 17 },
      { note: 'F', key: 'Z', type: 'white', index: 18 },
      { note: 'F#', key: 'X', type: 'black', index: 19 },
      { note: 'G', key: 'C', type: 'white', index: 20 },
      { note: 'G#', key: 'V', type: 'black', index: 21 },
      { note: 'A', key: 'B', type: 'white', index: 22 },
      { note: 'A#', key: 'N', type: 'black', index: 23 },
      { note: 'B', key: 'M', type: 'white', index: 24 }
    ];

    const isMobile = window.innerWidth <= 768;

    // First pass: create all white keys to establish their positions
    const whiteKeys = [];
    keyMap.forEach(({ note, key, type, index }) => {
      if (type === 'white') {
        const keyElement = document.createElement('div');
        keyElement.className = `piano-key ${type}`;
        keyElement.dataset.note = note;
        keyElement.dataset.key = key;
        keyElement.dataset.index = index;

        if (isMobile) {
          // Mobile: only show note names, no keyboard symbols
          keyElement.innerHTML = `<div>${note}</div>`;
        } else {
          // Desktop: show both note names and keyboard symbols
          keyElement.innerHTML = `
            <div>${note}</div>
            <div class="piano-key-label">${key}</div>
          `;
        }

        pianoKeysContainer.appendChild(keyElement);
        whiteKeys.push(keyElement);
      }
    });

    // Second pass: create black keys positioned between white keys
    keyMap.forEach(({ note, key, type, index }) => {
      if (type === 'black') {
        const keyElement = document.createElement('div');
        keyElement.className = `piano-key ${type}`;
        keyElement.dataset.note = note;
        keyElement.dataset.key = key;
        keyElement.dataset.index = index;

        if (isMobile) {
          // Mobile: only show note names, no keyboard symbols
          keyElement.innerHTML = `<div>${note}</div>`;
        } else {
          // Desktop: show both note names and keyboard symbols
          keyElement.innerHTML = `
            <div>${note}</div>
            <div class="piano-key-label">${key}</div>
          `;
        }

        // Position black key between the appropriate white keys
        keyElement.style.position = 'absolute';

        if (isMobile) {
          // Mobile: position black keys at the "top" (right side) between white keys
          const whiteKeyIndex = this.getWhiteKeyIndexForBlackKey(index);
          // Calculate position based on white key height (40px) + gap (2px) = 42px total
          const whiteKeyTop = whiteKeyIndex * 42;
          // Position black keys at the right side (top of vertical keyboard) between white keys
          keyElement.style.right = '0';
          keyElement.style.top = `${whiteKeyTop + 35}px`; // Slightly offset from white key center
        } else {
          // Desktop: position black keys between white keys horizontally
          const whiteKeyIndex = this.getWhiteKeyIndexForBlackKey(index);
          const whiteKeyLeft = whiteKeyIndex * 50; // 50px width per white key
          keyElement.style.left = `${whiteKeyLeft + 45}px`; // 45px from left edge of white key (perfectly centered between 2 white keys)
          keyElement.style.top = '0';
        }

        pianoKeysContainer.appendChild(keyElement);
      }
    });
  }

  bindPianoEvents() {
    // Mouse events
    document.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('piano-key')) {
        this.playPianoKey(e.target);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.target.classList.contains('piano-key')) {
        this.releasePianoKey(e.target);
      }
    });

    // Touch events for multi-touch support
    document.addEventListener(
      'touchstart',
      (e) => {
        const touches = e.changedTouches;
        let pianoKeyTouched = false;

        for (let i = 0; i < touches.length; i++) {
          const touch = touches[i];
          const element = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          );
          if (element && element.classList.contains('piano-key')) {
            this.playPianoKey(element);
            // Store touch ID for tracking
            element.dataset.touchId = touch.identifier;
            pianoKeyTouched = true;
          }
        }

        // Only prevent default if we actually touched a piano key
        if (pianoKeyTouched) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener(
      'touchend',
      (e) => {
        const touches = e.changedTouches;
        let pianoKeyReleased = false;

        for (let i = 0; i < touches.length; i++) {
          const touch = touches[i];
          const touchId = touch.identifier;
          // Find all keys with this touch ID and release them
          const keys = document.querySelectorAll(
            `[data-touch-id="${touchId}"]`
          );
          if (keys.length > 0) {
            keys.forEach((key) => {
              this.releasePianoKey(key);
              delete key.dataset.touchId;
            });
            pianoKeyReleased = true;
          }
        }

        // Only prevent default if we actually released piano keys
        if (pianoKeyReleased) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener(
      'touchcancel',
      (e) => {
        // Release all keys when touch is cancelled
        const activeKeys = document.querySelectorAll('.piano-key.active');
        if (activeKeys.length > 0) {
          activeKeys.forEach((key) => {
            this.releasePianoKey(key);
            delete key.dataset.touchId;
          });
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return; // Prevent key repeat

      const keyElement = document.querySelector(
        `[data-key="${e.key.toUpperCase()}"]`
      );
      if (keyElement) {
        e.preventDefault();
        this.playPianoKey(keyElement);
      }
    });

    document.addEventListener('keyup', (e) => {
      const keyElement = document.querySelector(
        `[data-key="${e.key.toUpperCase()}"]`
      );
      if (keyElement) {
        this.releasePianoKey(keyElement);
      }
    });

    // Handle window resize for responsive piano layout
    window.addEventListener('resize', () => {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.createPianoKeys();
      }, 250);
    });
  }

  playPianoKey(keyElement) {
    const index = parseInt(keyElement.dataset.index);
    let sample = this.pianoSamples[index];

    if (!sample) {
      // Check if we're still loading samples
      if (Object.keys(this.pianoSamples).length === 0) {
        this.updateStatus(
          '🎹 Piano samples still loading... Please wait a moment.'
        );
        return;
      }

      // Check if this specific key failed to load
      if (index in this.pianoSamples && this.pianoSamples[index] === null) {
        // This key specifically failed to load, use synthesized sound
        try {
          const frequency = this.getPianoFrequency(index);
          sample = this.createSynthesizedPianoSound(frequency);
        } catch (error) {
          this.updateStatus(
            `⚠️ Piano key ${index} not available. Please refresh the page.`
          );
          return;
        }
      } else {
        // Sample not loaded yet, wait for it
        this.updateStatus(
          `🎹 Loading piano key ${index}... Please wait a moment.`
        );
        return;
      }
    }

    if (this.audioContext.state === 'running') {
      // Add visual feedback
      keyElement.classList.add('active');

      // Play the sound
      const source = this.audioContext.createBufferSource();
      source.buffer = sample;
      source.connect(this.audioContext.destination);
      source.start();

      // Store reference to stop if needed
      keyElement.dataset.source = source;
    } else {
      this.updateStatus('🎵 Click anywhere to enable audio for piano');
    }
  }

  releasePianoKey(keyElement) {
    // Remove visual feedback
    keyElement.classList.remove('active');

    // Stop the sound if it's still playing
    const source = keyElement.dataset.source;
    if (source) {
      try {
        source.stop();
      } catch (error) {
        // Sound might have already finished
      }
      delete keyElement.dataset.source;
    }
  }
}

// Initialize drum machine when page loads
document.addEventListener('DOMContentLoaded', () => {
  new DrumMachine();
});
