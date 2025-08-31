/**
 * Main entry point for Drum Machine application
 * Imports all modules and initializes the application
 */

import { DrumMachine } from './DrumMachine.js';
import { AudioManager } from './audio/AudioManager.js';
import { BeatStorage } from './storage/BeatStorage.js';
import { PianoManager } from './piano/PianoManager.js';
import CONSTANTS from './config/constants.js';

// Initialize drum machine when page loads
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Create managers
    const audioManager = new AudioManager();
    const beatStorage = new BeatStorage();
    const pianoManager = new PianoManager(audioManager);

    // Initialize main application
    const drumMachine = new DrumMachine(
      audioManager,
      beatStorage,
      pianoManager
    );

    // Make available globally for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      window.drumMachine = drumMachine;
      window.audioManager = audioManager;
      window.beatStorage = beatStorage;
      window.pianoManager = pianoManager;
      window.CONSTANTS = CONSTANTS;
    }

    console.log('🎵 Drum Machine initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize Drum Machine:', error);

    // Show user-friendly error message
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent =
        'Failed to initialize. Please refresh the page.';
    }
  }
});

// Export for potential external use
export { DrumMachine, AudioManager, BeatStorage, PianoManager, CONSTANTS };
