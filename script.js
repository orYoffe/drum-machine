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
        
        this.drumTypes = ['kick', 'snare', 'hihat', 'crash', 'tom1', 'tom2', 'ride', 'clap', 'bass'];
        
        // Mute state for each drum type
        this.mutedDrums = {};
        this.drumTypes.forEach(type => {
            this.mutedDrums[type] = false;
        });
        
        this.init();
    }

    async init() {
        try {
            // Initialize audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load samples
            await this.loadSamples();
            
            // Initialize sequencer
            this.initSequencer();
            
            // Initialize UI
            this.initUI();
            
            // Load from URL if present
            this.loadFromURL();
            
            // Load from local storage
            this.loadFromLocalStorage();
            
            // Load saved theme
            this.loadTheme();
            
            // Load mute state
            this.loadMuteState();
            
            // Initialize mute buttons
            this.initMuteButtons();
            
            this.updateStatus('Ready to create beats!');
        } catch (error) {
            console.error('Failed to initialize drum machine:', error);
            this.updateStatus('Failed to initialize audio. Please refresh the page.');
        }
    }

    async loadSamples() {
        // Load local drum samples with fallback to synthesized sounds
        const loadPromises = this.drumTypes.map(async (type) => {
            try {
                const audioBuffer = await loadSample(this.audioContext, type);
                if (audioBuffer) {
                    this.samples[type] = audioBuffer;
                } else {
                    // Fallback to synthesized sound if loading fails
                    console.warn(`Using synthesized sound for ${type} - sample loading failed`);
                    this.samples[type] = this.createSynthesizedSound(type);
                }
            } catch (error) {
                console.error(`Failed to load ${type} sample:`, error);
                // Fallback to synthesized sound
                this.samples[type] = this.createSynthesizedSound(type);
            }
        });
        
        await Promise.all(loadPromises);
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
        if (typeof SOUND_COLLECTIONS !== 'undefined' && SOUND_COLLECTIONS[drumType]) {
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
                Object.keys(SOUND_COLLECTIONS).forEach(drumType => {
                    const defaultSound = SOUND_COLLECTIONS[drumType].default;
                    if (typeof changeSound === 'function') {
                        changeSound(drumType, defaultSound);
                    }
                });
                
                // Reload all samples
                await this.loadSamples();
                
                // Refresh all sound selection UIs
                this.drumTypes.forEach(drumType => {
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
        this.drumTypes.forEach(drumType => {
            this.mutedDrums[drumType] = true;
            this.updateMuteButton(drumType);
        });
        this.saveMuteState();
        this.updateMuteAllButton();
        this.updateStatus('All drums muted');
    }

    // Method to unmute all drums
    unmuteAll() {
        this.drumTypes.forEach(drumType => {
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
        const gridRow = document.querySelector(`#sequencer-grid .grid-row:nth-child(${drumIndex + 1})`);
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
            if (this.drumTypes.every(drumType => this.mutedDrums[drumType])) {
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
            localStorage.setItem('drumMachineMuteState', JSON.stringify(this.mutedDrums));
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
                this.drumTypes.forEach(drumType => {
                    if (savedMuteState.hasOwnProperty(drumType)) {
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
        this.drumTypes.forEach(drumType => {
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
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
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
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
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
                    
                    data[i] = (body * 0.4 + harmonics * 0.3 + noise * 0.2 + ring * 0.1) * 0.7;
                }
                break;
                
            case 'hihat':
                // Crisp, bright hi-hat with metallic character
                duration = 0.1;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
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
                    
                    data[i] = (high1 * 0.3 + high2 * 0.3 + noise * 0.3 + metallic * 0.1) * 0.6;
                }
                break;
                
            case 'crash':
                // Explosive crash with long decay
                duration = 0.8;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
                data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    const t = i / sampleRate;
                    // Multiple frequencies for complexity
                    const freq1 = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 2);
                    const freq2 = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 1.5);
                    const freq3 = Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 1.8);
                    // Noise for impact
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 3);
                    
                    data[i] = (freq1 * 0.3 + freq2 * 0.3 + freq3 * 0.2 + noise * 0.2) * 0.5;
                }
                break;
                
            case 'tom1':
                // Mid-tom with warm tone
                duration = 0.3;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
                data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    const t = i / sampleRate;
                    const fundamental = Math.sin(2 * Math.PI * 120 * t) * Math.exp(-t * 3);
                    const overtone = Math.sin(2 * Math.PI * 240 * t) * Math.exp(-t * 4);
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 10);
                    
                    data[i] = (fundamental * 0.6 + overtone * 0.3 + noise * 0.1) * 0.7;
                }
                break;
                
            case 'tom2':
                // High-tom with bright attack
                duration = 0.25;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
                data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    const t = i / sampleRate;
                    const fundamental = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 4);
                    const overtone = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 5);
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
                    
                    data[i] = (fundamental * 0.6 + overtone * 0.3 + noise * 0.1) * 0.7;
                }
                break;
                
            case 'ride':
                // Metallic ride with ping and wash
                duration = 0.6;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
                data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    const t = i / sampleRate;
                    const ping = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 2);
                    const wash = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 1.5);
                    const metallic = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 2.5);
                    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 4);
                    
                    data[i] = (ping * 0.4 + wash * 0.3 + metallic * 0.2 + noise * 0.1) * 0.6;
                }
                break;
                
            case 'clap':
                // Sharp clap with stereo spread simulation
                duration = 0.15;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
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
                    
                    data[i] = (attack * 0.4 + body * 0.3 + high * 0.2 + decay * 0.1) * 0.7;
                }
                break;
                
            default:
                duration = 0.1;
                buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
                data = buffer.getChannelData(0);
                data.fill(0);
        }
        
        return buffer;
    }

    initSequencer() {
        this.sequencer = {};
        this.drumTypes.forEach(type => {
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
        
        // Start audio context on first user interaction
        document.addEventListener('click', () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
    }

    initSoundSelection() {
        // Populate sound selection UI for each drum type
        this.drumTypes.forEach(drumType => {
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

        availableSounds.forEach(sound => {
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
                container.querySelectorAll('.sound-option').forEach(opt => {
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
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
        
        // Stop button
        document.getElementById('stop-btn').addEventListener('click', () => this.stop());
        
        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => this.clearPattern());
        
        // Tempo control
        document.getElementById('tempo').addEventListener('input', (e) => {
            this.tempo = parseInt(e.target.value);
            document.getElementById('tempo-display').textContent = this.tempo;
        });
        
        // Pattern length control
        document.getElementById('pattern-length').addEventListener('change', (e) => {
            this.patternLength = parseInt(e.target.value);
            this.initSequencer();
            this.generateGrid();
        });
        
        // Drum pad buttons
        document.querySelectorAll('.drum-pad').forEach(pad => {
            pad.addEventListener('click', () => this.playSound(pad.dataset.sound));
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Share button
        document.getElementById('share-btn').addEventListener('click', () => this.shareBeat());
        
        // Load button
        document.getElementById('load-btn').addEventListener('click', () => this.loadBeat());
        
        // Save local button
        document.getElementById('save-local-btn').addEventListener('click', () => this.saveToLocalStorage());
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        
        // Reset sounds button
        document.getElementById('reset-sounds-btn').addEventListener('click', () => this.resetAllSounds());
        
        // Mute all button
        document.getElementById('mute-all-btn').addEventListener('click', () => {
            if (this.drumTypes.every(drumType => this.mutedDrums[drumType])) {
                this.unmuteAll();
            } else {
                this.muteAll();
            }
        });
        
        // Individual mute buttons
        document.querySelectorAll('.mute-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const drumType = btn.dataset.drum;
                this.toggleMute(drumType);
            });
        });
    }

    handleKeyPress(e) {
        if (e.repeat) return;
        
        const keyMap = {
            '1': 'kick',
            '2': 'snare',
            '3': 'hihat',
            '4': 'crash',
            '5': 'tom1',
            '6': 'tom2',
            '7': 'ride',
            '8': 'clap',
            '9': 'bass',
            ' ': 'play', // Spacebar
            'c': 'clear' // C key
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
        
        const cell = document.querySelector(`[data-row="${rowIndex}"][data-step="${step}"]`);
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
        document.querySelectorAll('.grid-cell.current').forEach(cell => {
            cell.classList.remove('current');
        });
        
        this.updateStatus('Stopped');
    }

    playStep() {
        if (!this.isPlaying) return;
        
        // Clear previous current step
        document.querySelectorAll('.grid-cell.current').forEach(cell => {
            cell.classList.remove('current');
        });
        
        // Highlight current step
        this.drumTypes.forEach((drumType, rowIndex) => {
            const cell = document.querySelector(`[data-row="${rowIndex}"][data-step="${this.currentStep}"]`);
            if (cell) {
                cell.classList.add('current');
            }
        });
        
        // Play sounds for current step
        this.drumTypes.forEach(drumType => {
            if (this.sequencer[drumType][this.currentStep] && !this.mutedDrums[drumType]) {
                this.playSound(drumType);
            }
        });
        
        // Move to next step
        this.currentStep = (this.currentStep + 1) % this.patternLength;
        
        // Schedule next step
        const stepTime = (60 / this.tempo) * 4 / this.patternLength;
        setTimeout(() => this.playStep(), stepTime * 1000);
    }

    playSound(drumType) {
        if (!this.samples[drumType] || this.mutedDrums[drumType]) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.samples[drumType];
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Add some variation to make it sound more natural
        gainNode.gain.value = 0.7 + Math.random() * 0.3;
        
        source.start();
    }

    // Removed recording functionality

    updateGridDisplay() {
        this.drumTypes.forEach((drumType, rowIndex) => {
            this.sequencer[drumType].forEach((isActive, step) => {
                const cell = document.querySelector(`[data-row="${rowIndex}"][data-step="${step}"]`);
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
        const beatData = {
            sequencer: this.sequencer,
            tempo: this.tempo,
            patternLength: this.patternLength
        };
        
        const encoded = btoa(JSON.stringify(beatData));
        const url = `${window.location.origin}${window.location.pathname}?beat=${encoded}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            this.updateStatus('Beat URL copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.updateStatus('Beat URL copied to clipboard!');
        });
    }

    loadBeat() {
        const url = prompt('Paste the beat URL here:');
        if (url) {
            try {
                const urlObj = new URL(url);
                const beatParam = urlObj.searchParams.get('beat');
                if (beatParam) {
                    const decoded = JSON.parse(atob(beatParam));
                    this.loadBeatData(decoded);
                    this.updateStatus('Beat loaded successfully!');
                }
            } catch (error) {
                this.updateStatus('Invalid beat URL');
            }
        }
    }

    loadBeatData(data) {
        if (data.sequencer) {
            this.sequencer = data.sequencer;
        }
        if (data.tempo) {
            this.tempo = data.tempo;
            document.getElementById('tempo').value = this.tempo;
            document.getElementById('tempo-display').textContent = this.tempo;
        }
        if (data.patternLength) {
            this.patternLength = data.patternLength;
            document.getElementById('pattern-length').value = this.patternLength;
            this.generateGrid();
        }
        
        this.updateGridDisplay();
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const beatParam = urlParams.get('beat');
        
        if (beatParam) {
            try {
                const decoded = JSON.parse(atob(beatParam));
                this.loadBeatData(decoded);
                this.updateStatus('Beat loaded from URL');
            } catch (error) {
                // Silent error handling
            }
        }
    }

    saveToLocalStorage() {
        const beatData = {
            sequencer: this.sequencer,
            tempo: this.tempo,
            patternLength: this.patternLength,
            timestamp: Date.now()
        };
        
        localStorage.setItem('drumMachineBeat', JSON.stringify(beatData));
        this.updateStatus('Beat saved to local storage');
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('drumMachineBeat');
        if (saved) {
            try {
                const beatData = JSON.parse(saved);
                this.loadBeatData(beatData);
                this.updateStatus('Beat loaded from local storage');
            } catch (error) {
                // Silent error handling
            }
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
                const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
}

// Initialize drum machine when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DrumMachine();
});
