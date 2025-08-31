/**
 * AudioManager - Handles all Web Audio API operations and audio context lifecycle
 * This class encapsulates all audio-related functionality to improve separation of concerns
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.audioSources = new Map(); // Track active audio sources
    this.sampleRate = 44100;
    this.latencyHint = 'interactive';
  }

  /**
   * Initialize the audio context with cross-platform support
   */
  async initialize() {
    try {
      // Create audio context with better cross-platform support
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        latencyHint: this.latencyHint,
        sampleRate: this.sampleRate,
        // Better compatibility for mobile and Linux
        ...(navigator.userAgent.includes('Mobile') && {
          latencyHint: 'balanced',
          sampleRate: 22050
        })
      });

      this.isInitialized = true;

      // Audio context starts suspended (normal behavior)
      if (this.audioContext.state === 'suspended') {
        console.log(
          '🎵 Audio context suspended - waiting for user interaction'
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Resume audio context if suspended
   */
  async resumeAudioContext() {
    try {
      if (!this.audioContext || !this.isInitialized) {
        console.warn('Audio context not available');
        return false;
      }

      // Check if we're in a browser environment that allows audio context resume
      if (typeof this.audioContext.resume !== 'function') {
        console.warn('Audio context resume not supported');
        return false;
      }

      // Only resume if suspended
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('🎵 Audio context resumed successfully');
          return true;
        } catch (resumeError) {
          console.error('Failed to resume audio context:', resumeError);
          return false;
        }
      } else if (this.audioContext.state === 'running') {
        // Already running
        return true;
      } else if (this.audioContext.state === 'closed') {
        console.warn('Audio context is closed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to resume audio context:', error);
      return false;
    }
  }

  /**
   * Check audio context health
   */
  checkAudioContextHealth() {
    if (!this.audioContext || !this.isInitialized) {
      return {
        healthy: false,
        state: 'not-initialized',
        message: 'Audio context not initialized'
      };
    }

    switch (this.audioContext.state) {
      case 'running':
        return {
          healthy: true,
          state: 'running',
          message: 'Audio context running normally'
        };
      case 'suspended':
        return {
          healthy: false,
          state: 'suspended',
          message: 'Audio context suspended - needs user interaction'
        };
      case 'closed':
        return {
          healthy: false,
          state: 'closed',
          message: 'Audio context closed - cannot recover'
        };
      default:
        return {
          healthy: false,
          state: 'unknown',
          message: 'Unknown audio context state'
        };
    }
  }

  /**
   * Attempt to restore a closed audio context or resume a suspended one
   */
  async restoreAudioContext() {
    try {
      if (!this.audioContext || !this.isInitialized) {
        return await this.initialize();
      }

      if (this.audioContext.state === 'closed') {
        // Create new audio context if the old one is closed
        console.log('Creating new audio context - old one was closed');
        return await this.initialize();
      } else if (this.audioContext.state === 'suspended') {
        return await this.resumeAudioContext();
      }

      return true;
    } catch (error) {
      console.error('Failed to restore audio context:', error);
      return false;
    }
  }

  /**
   * Create a buffer source for audio playback
   */
  createBufferSource() {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error('Audio context not available');
    }

    const source = this.audioContext.createBufferSource();

    // Track this source for cleanup
    const sourceId = Date.now() + Math.random();
    this.audioSources.set(sourceId, source);

    // Clean up when source finishes
    source.onended = () => {
      this.audioSources.delete(sourceId);
    };

    return { source, sourceId };
  }

  /**
   * Get the audio destination node
   */
  getDestination() {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error('Audio context not available');
    }
    return this.audioContext.destination;
  }

  /**
   * Get current audio context state
   */
  getState() {
    if (!this.audioContext || !this.isInitialized) {
      return 'not-initialized';
    }
    return this.audioContext.state;
  }

  /**
   * Check if audio context is running
   */
  isRunning() {
    return this.getState() === 'running';
  }

  /**
   * Check if audio context is suspended
   */
  isSuspended() {
    return this.getState() === 'suspended';
  }

  /**
   * Check if audio context is closed
   */
  isClosed() {
    return this.getState() === 'closed';
  }

  /**
   * Create a gain node for volume control
   */
  createGainNode() {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error('Audio context not available');
    }
    return this.audioContext.createGain();
  }

  /**
   * Decode audio data from array buffer
   */
  async decodeAudioData(arrayBuffer) {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error('Audio context not available');
    }
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Create an audio buffer for synthesized sounds
   */
  createAudioBuffer(numberOfChannels, length, sampleRate) {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error('Audio context not available');
    }
    return this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
  }

  /**
   * Stop all active audio sources
   */
  stopAllSources() {
    this.audioSources.forEach((source, id) => {
      try {
        if (source.state === 'playing') {
          source.stop();
        }
      } catch (error) {
        console.warn(`Failed to stop audio source ${id}:`, error);
      }
    });
    this.audioSources.clear();
  }

  /**
   * Clean up resources
   */
  destroy() {
    try {
      this.stopAllSources();

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }

      this.audioContext = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during AudioManager cleanup:', error);
    }
  }

  /**
   * Get audio context info for debugging
   */
  getInfo() {
    if (!this.audioContext || !this.isInitialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      state: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
      activeSourceCount: this.audioSources.size,
      latencyHint: this.latencyHint
    };
  }
}
