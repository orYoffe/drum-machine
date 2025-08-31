import {
  STORAGE_KEYS,
  VALIDATION_RULES,
  createDefaultBeat,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../config/constants.js';

/**
 * BeatStorage Class
 * Handles all local storage operations for beats
 * Manages beat persistence, validation, and conflict resolution
 */
export class BeatStorage {
  constructor() {
    this.storageKey = STORAGE_KEYS.BEATS;
    this.beats = this.loadAllBeats();
  }

  /**
   * Save a beat with validation and conflict resolution
   * @param {string} name - Beat name
   * @param {Object} data - Beat data
   * @param {boolean} overwrite - Whether to overwrite existing beat
   * @returns {Object} Result object with success status and message
   */
  saveBeat(name, data, overwrite = false) {
    try {
      // Validate inputs
      const nameValidation = this.validateBeatName(name);
      if (!nameValidation.valid) {
        return { success: false, message: nameValidation.message };
      }

      const dataValidation = this.validateBeatData(data);
      if (!dataValidation.valid) {
        return { success: false, message: dataValidation.message };
      }

      // Check for name conflicts
      const existingBeat = this.getBeatByName(name);
      if (existingBeat && !overwrite) {
        return {
          success: false,
          message: ERROR_MESSAGES.BEAT_NAME_CONFLICT,
          conflict: true,
          existingBeat
        };
      }

      // Prepare beat object
      const beat = {
        name: name.trim(),
        data: { ...data },
        timestamp: Date.now(),
        lastUsed: Date.now()
      };

      // Update or add beat
      if (existingBeat) {
        const index = this.beats.findIndex((b) => b.name === name);
        this.beats[index] = beat;
      } else {
        this.beats.push(beat);
      }

      // Save to localStorage
      this.persistBeats();

      return {
        success: true,
        message: SUCCESS_MESSAGES.BEAT_SAVED,
        beat
      };
    } catch (error) {
      console.error('Error saving beat:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.STORAGE_FAILED
      };
    }
  }

  /**
   * Load a specific beat by name
   * @param {string} name - Beat name
   * @returns {Object|null} Beat object or null if not found
   */
  loadBeat(name) {
    try {
      const beat = this.getBeatByName(name);
      if (beat) {
        // Update last used timestamp
        beat.lastUsed = Date.now();
        this.persistBeats();
        return beat;
      }
      return null;
    } catch (error) {
      console.error('Error loading beat:', error);
      return null;
    }
  }

  /**
   * Load all saved beats
   * @returns {Array} Array of all saved beats
   */
  loadAllBeats() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const beats = JSON.parse(stored);

      // Validate stored data structure
      if (!Array.isArray(beats)) {
        console.warn('Invalid beats data structure, clearing corrupted data');
        this.clearAllBeats();
        return [];
      }

      // Filter out corrupted entries
      const validBeats = beats.filter((beat) =>
        this.isValidBeatStructure(beat)
      );

      // If we lost data due to corruption, save the cleaned version
      if (validBeats.length !== beats.length) {
        this.beats = validBeats;
        this.persistBeats();
      }

      return validBeats;
    } catch (error) {
      console.error('Error loading beats from localStorage:', error);
      // Clean up corrupted data
      this.clearAllBeats();
      return [];
    }
  }

  /**
   * Delete a beat by name
   * @param {string} name - Beat name
   * @returns {Object} Result object with success status and message
   */
  deleteBeat(name) {
    try {
      const initialCount = this.beats.length;
      this.beats = this.beats.filter((beat) => beat.name !== name);

      if (this.beats.length === initialCount) {
        return {
          success: false,
          message: `Beat "${name}" not found`
        };
      }

      this.persistBeats();
      return {
        success: true,
        message: SUCCESS_MESSAGES.BEAT_DELETED
      };
    } catch (error) {
      console.error('Error deleting beat:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.STORAGE_FAILED
      };
    }
  }

  /**
   * Get the most recently used beat
   * @returns {Object|null} Most recently used beat or null if none exist
   */
  getLastUsedBeat() {
    if (this.beats.length === 0) return null;

    return this.beats.reduce((latest, current) =>
      current.lastUsed > latest.lastUsed ? current : latest
    );
  }

  /**
   * Get a beat by name
   * @param {string} name - Beat name
   * @returns {Object|null} Beat object or null if not found
   */
  getBeatByName(name) {
    return this.beats.find((beat) => beat.name === name) || null;
  }

  /**
   * Check if a beat name exists
   * @param {string} name - Beat name to check
   * @returns {boolean} True if name exists
   */
  beatNameExists(name) {
    return this.beats.some((beat) => beat.name === name);
  }

  /**
   * Get all beat names
   * @returns {Array} Array of beat names
   */
  getAllBeatNames() {
    return this.beats.map((beat) => beat.name);
  }

  /**
   * Get beat count
   * @returns {number} Number of saved beats
   */
  getBeatCount() {
    return this.beats.length;
  }

  /**
   * Clear all beats
   * @returns {Object} Result object with success status and message
   */
  clearAllBeats() {
    try {
      this.beats = [];
      this.persistBeats();
      return {
        success: true,
        message: 'All beats cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing beats:', error);
      return {
        success: false,
        message: ERROR_MESSAGES.STORAGE_FAILED
      };
    }
  }

  /**
   * Handle beat name conflicts by suggesting alternatives
   * @param {string} baseName - Original name
   * @returns {string} Suggested unique name
   */
  handleNameConflict(baseName) {
    let counter = 1;
    let suggestedName = baseName;

    while (this.beatNameExists(suggestedName)) {
      suggestedName = `${baseName} (${counter})`;
      counter++;
    }

    return suggestedName;
  }

  /**
   * Validate beat name
   * @param {string} name - Beat name to validate
   * @returns {Object} Validation result with valid flag and message
   */
  validateBeatName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        message: ERROR_MESSAGES.BEAT_NAME_EMPTY
      };
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return {
        valid: false,
        message: ERROR_MESSAGES.BEAT_NAME_EMPTY
      };
    }

    if (trimmedName.length > VALIDATION_RULES.BEAT_NAME.maxLength) {
      return {
        valid: false,
        message: `Beat name too long (max ${VALIDATION_RULES.BEAT_NAME.maxLength} characters)`
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * Validate beat data structure
   * @param {Object} data - Beat data to validate
   * @returns {Object} Validation result with valid flag and message
   */
  validateBeatData(data) {
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        message: ERROR_MESSAGES.INVALID_BEAT_DATA
      };
    }

    // Validate tempo
    if (
      typeof data.tempo !== 'number' ||
      data.tempo < VALIDATION_RULES.TEMPO.min ||
      data.tempo > VALIDATION_RULES.TEMPO.max
    ) {
      return {
        valid: false,
        message: `Tempo must be between ${VALIDATION_RULES.TEMPO.min} and ${VALIDATION_RULES.TEMPO.max}`
      };
    }

    // Validate pattern length
    if (
      typeof data.patternLength !== 'number' ||
      !VALIDATION_RULES.PATTERN_LENGTH.allowed.includes(data.patternLength)
    ) {
      return {
        valid: false,
        message: `Pattern length must be one of: ${VALIDATION_RULES.PATTERN_LENGTH.allowed.join(', ')}`
      };
    }

    // Validate sequencer
    if (!data.sequencer || typeof data.sequencer !== 'object') {
      return {
        valid: false,
        message: 'Sequencer data is required'
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * Check if a beat has valid structure
   * @param {Object} beat - Beat object to check
   * @returns {boolean} True if beat has valid structure
   */
  isValidBeatStructure(beat) {
    if (!beat || typeof beat !== 'object') return false;
    if (!beat.name || typeof beat.name !== 'string') return false;
    if (!beat.data || typeof beat.data !== 'object') return false;
    if (typeof beat.timestamp !== 'number') return false;
    if (typeof beat.lastUsed !== 'number') return false;

    return this.validateBeatData(beat.data).valid;
  }

  /**
   * Clean up corrupted data
   * @returns {number} Number of corrupted entries removed
   */
  cleanupCorruptedData() {
    const initialCount = this.beats.length;
    this.beats = this.beats.filter((beat) => this.isValidBeatStructure(beat));
    const removedCount = initialCount - this.beats.length;

    if (removedCount > 0) {
      this.persistBeats();
    }

    return removedCount;
  }

  /**
   * Export all beats as JSON string
   * @returns {string} JSON string of all beats
   */
  exportBeats() {
    try {
      return JSON.stringify(this.beats, null, 2);
    } catch (error) {
      console.error('Error exporting beats:', error);
      return '[]';
    }
  }

  /**
   * Import beats from JSON string
   * @param {string} jsonString - JSON string of beats
   * @returns {Object} Result object with success status and imported count
   */
  importBeats(jsonString) {
    try {
      const importedBeats = JSON.parse(jsonString);

      if (!Array.isArray(importedBeats)) {
        return {
          success: false,
          message: 'Invalid import format - expected array of beats'
        };
      }

      // Validate each imported beat
      const validBeats = importedBeats.filter((beat) =>
        this.isValidBeatStructure(beat)
      );
      const invalidCount = importedBeats.length - validBeats.length;

      if (validBeats.length === 0) {
        return {
          success: false,
          message: 'No valid beats found in import data'
        };
      }

      // Add imported beats (handle conflicts by appending timestamp)
      let addedCount = 0;
      validBeats.forEach((beat) => {
        const originalName = beat.name;
        while (this.beatNameExists(beat.name)) {
          beat.name = `${originalName}_${Date.now()}`;
        }

        beat.timestamp = Date.now();
        beat.lastUsed = Date.now();
        this.beats.push(beat);
        addedCount++;
      });

      this.persistBeats();

      return {
        success: true,
        message: `Imported ${addedCount} beats successfully${invalidCount > 0 ? ` (${invalidCount} invalid entries skipped)` : ''}`,
        importedCount: addedCount,
        invalidCount
      };
    } catch (error) {
      console.error('Error importing beats:', error);
      return {
        success: false,
        message: 'Invalid JSON format'
      };
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    const totalSize = new Blob([JSON.stringify(this.beats)]).size;
    const avgBeatSize =
      this.beats.length > 0 ? totalSize / this.beats.length : 0;

    return {
      totalBeats: this.beats.length,
      totalSize: totalSize,
      averageBeatSize: Math.round(avgBeatSize),
      storageKey: this.storageKey,
      lastUpdated:
        this.beats.length > 0
          ? Math.max(...this.beats.map((b) => b.timestamp))
          : null
    };
  }

  /**
   * Persist beats to localStorage
   * @private
   */
  persistBeats() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.beats));
    } catch (error) {
      console.error('Error persisting beats to localStorage:', error);
      throw new Error(ERROR_MESSAGES.STORAGE_FAILED);
    }
  }

  /**
   * Refresh beats from localStorage
   * Useful for handling external changes
   */
  refresh() {
    this.beats = this.loadAllBeats();
  }
}

export default BeatStorage;
