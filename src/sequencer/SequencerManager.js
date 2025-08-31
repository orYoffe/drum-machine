import {
  PATTERN_CONFIG,
  DRUM_TYPES,
  VALIDATION_RULES,
  createDefaultBeat
} from '../config/constants.js';

/**
 * SequencerManager Class
 * Handles all sequencer grid functionality including grid creation,
 * step management, and data serialization/deserialization
 */
export class SequencerManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      patternLength: options.patternLength || PATTERN_CONFIG.DEFAULT_LENGTH,
      drumTypes: options.drumTypes || [...DRUM_TYPES],
      cellSize: options.cellSize || 40,
      cellGap: options.cellGap || 2,
      ...options
    };

    this.grid = new Map(); // Map<drumType, Map<stepIndex, boolean>>
    this.isPlaying = false;
    this.currentStep = 0;
    this.animationFrame = null;

    // Initialize grid data
    this.initializeGrid();

    // Bind methods to preserve context
    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleCellHover = this.handleCellHover.bind(this);
    this.updateGridDisplay = this.updateGridDisplay.bind(this);
  }

  /**
   * Initialize the sequencer grid
   * @private
   */
  initializeGrid() {
    this.grid.clear();

    this.options.drumTypes.forEach((drumType) => {
      const stepMap = new Map();
      for (let step = 0; step < this.options.patternLength; step++) {
        stepMap.set(step, false);
      }
      this.grid.set(drumType, stepMap);
    });
  }

  /**
   * Create the sequencer grid DOM structure
   * @returns {boolean} Success status
   */
  createGrid() {
    try {
      if (!this.container) {
        console.error('Container element not provided');
        return false;
      }

      // Clear existing grid
      this.container.innerHTML = '';

      // Create grid rows (matching old structure)
      this.options.drumTypes.forEach((drumType, rowIndex) => {
        const row = document.createElement('div');
        row.className = 'grid-row';
        row.style.gridTemplateColumns = `repeat(${this.options.patternLength}, 1fr)`;

        // Create grid cells
        for (let step = 0; step < this.options.patternLength; step++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.dataset.row = rowIndex;
          cell.dataset.step = step;
          cell.dataset.drum = drumType;

          // Add click event
          cell.addEventListener('click', () => this.handleCellClick(cell, drumType, step));

          row.appendChild(cell);
        }

        this.container.appendChild(row);
      });

      // Bind events
      this.bindGridEvents();

      return true;
    } catch (error) {
      console.error('Error creating sequencer grid:', error);
      return false;
    }
  }





  /**
   * Bind grid events
   * @private
   */
  bindGridEvents() {
    // Additional event bindings can be added here
    // Most events are bound during cell creation
  }

  /**
   * Handle cell click
   * @param {HTMLElement} cell - Grid cell element
   * @param {string} drumType - The drum type
   * @param {number} stepIndex - The step index
   * @private
   */
  handleCellClick(cell, drumType, stepIndex) {
    if (drumType && stepIndex !== undefined) {
      this.toggleStep(drumType, stepIndex);
      this.updateCellDisplay(cell, drumType, stepIndex);
      
      // Call the callback if provided
      if (this.options.onStepToggle) {
        this.options.onStepToggle(drumType, stepIndex);
      }
    }
  }

  /**
   * Handle cell hover
   * @param {HTMLElement} cell - Grid cell element
   * @param {boolean} isHovering - Whether mouse is hovering
   * @private
   */
  handleCellHover(cell, isHovering) {
    if (isHovering) {
      cell.style.backgroundColor = 'var(--accent-color)';
      cell.style.opacity = '0.8';
    } else {
      const drumType = cell.dataset.drum;
      const stepIndex = parseInt(cell.dataset.step);
      this.updateCellDisplay(cell, drumType, stepIndex);
    }
  }

  /**
   * Update individual cell display
   * @param {HTMLElement} cell - Grid cell element
   * @param {string} drumType - Drum type
   * @param {number} stepIndex - Step index
   * @private
   */
  updateCellDisplay(cell, drumType, stepIndex) {
    if (!cell || !drumType || stepIndex === undefined) return;

    const isActive = this.getStepState(drumType, stepIndex);

    if (isActive) {
      cell.style.backgroundColor = 'var(--accent-color)';
      cell.style.borderColor = 'var(--accent-color-dark)';
    } else {
      cell.style.backgroundColor = 'var(--background-secondary)';
      cell.style.borderColor = 'var(--border-color)';
    }

    cell.style.opacity = '1';
  }

  /**
   * Update entire grid display
   */
  updateGridDisplay() {
    this.options.drumTypes.forEach((drumType) => {
      for (let step = 0; step < this.options.patternLength; step++) {
        const cell = this.container.querySelector(
          `[data-drum="${drumType}"][data-step="${step}"]`
        );
        if (cell) {
          this.updateCellDisplay(cell, drumType, step);
        }
      }
    });
  }

  /**
   * Toggle step state
   * @param {string} drumType - Drum type
   * @param {number} stepIndex - Step index
   * @returns {boolean} New step state
   */
  toggleStep(drumType, stepIndex) {
    if (!this.validateStep(drumType, stepIndex)) {
      return false;
    }

    const stepMap = this.grid.get(drumType);
    if (!stepMap) return false;

    const currentState = stepMap.get(stepIndex) || false;
    const newState = !currentState;

    stepMap.set(stepIndex, newState);
    return newState;
  }

  /**
   * Get step state
   * @param {string} drumType - Drum type
   * @param {number} stepIndex - Step index
   * @returns {boolean} Step state
   */
  getStepState(drumType, stepIndex) {
    if (!this.validateStep(drumType, stepIndex)) {
      return false;
    }

    const stepMap = this.grid.get(drumType);
    return stepMap ? stepMap.get(stepIndex) || false : false;
  }

  /**
   * Set step state
   * @param {string} drumType - Drum type
   * @param {number} stepIndex - Step index
   * @param {boolean} state - New state
   * @returns {boolean} Success status
   */
  setStepState(drumType, stepIndex, state) {
    if (!this.validateStep(drumType, stepIndex)) {
      return false;
    }

    const stepMap = this.grid.get(drumType);
    if (!stepMap) return false;

    stepMap.set(stepIndex, Boolean(state));
    return true;
  }

  /**
   * Validate step parameters
   * @param {string} drumType - Drum type
   * @param {number} stepIndex - Step index
   * @returns {boolean} Validation result
   * @private
   */
  validateStep(drumType, stepIndex) {
    if (!drumType || typeof drumType !== 'string') return false;
    if (
      typeof stepIndex !== 'number' ||
      stepIndex < 0 ||
      stepIndex >= this.options.patternLength
    )
      return false;
    if (!this.options.drumTypes.includes(drumType)) return false;

    return true;
  }

  /**
   * Update grid size
   * @param {number} newLength - New pattern length
   * @returns {boolean} Success status
   */
  updateGridSize(newLength) {
    if (!this.validatePatternLength(newLength)) {
      return false;
    }

    try {
      // Update options
      this.options.patternLength = newLength;

      // Reinitialize grid data
      this.initializeGrid();

      // Recreate grid DOM
      this.createGrid();

      return true;
    } catch (error) {
      console.error('Error updating grid size:', error);
      return false;
    }
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
   * Clear all steps
   * @returns {boolean} Success status
   */
  clearGrid() {
    try {
      this.grid.forEach((stepMap) => {
        stepMap.forEach((value, step) => {
          stepMap.set(step, false);
        });
      });

      this.updateGridDisplay();
      return true;
    } catch (error) {
      console.error('Error clearing grid:', error);
      return false;
    }
  }

  /**
   * Get sequencer data
   * @returns {Object} Sequencer data object
   */
  getSequencerData() {
    const data = {};

    this.grid.forEach((stepMap, drumType) => {
      data[drumType] = Array.from(stepMap.values());
    });

    return data;
  }

  /**
   * Set sequencer data
   * @param {Object} data - Sequencer data object
   * @returns {boolean} Success status
   */
  setSequencerData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    try {
      // Clear existing data
      this.initializeGrid();

      // Set new data
      Object.entries(data).forEach(([drumType, steps]) => {
        if (this.options.drumTypes.includes(drumType) && Array.isArray(steps)) {
          const stepMap = this.grid.get(drumType);
          if (stepMap) {
            steps.forEach((step, index) => {
              if (index < this.options.patternLength) {
                stepMap.set(index, Boolean(step));
              }
            });
          }
        }
      });

      // Update display
      this.updateGridDisplay();

      return true;
    } catch (error) {
      console.error('Error setting sequencer data:', error);
      return false;
    }
  }

  /**
   * Optimize sequencer data for storage/sharing
   * @returns {Object} Optimized sequencer data
   */
  optimizeSequencerData() {
    const optimized = {};

    this.grid.forEach((stepMap, drumType) => {
      const activeSteps = [];

      stepMap.forEach((isActive, stepIndex) => {
        if (isActive) {
          activeSteps.push(stepIndex);
        }
      });

      // Only include drum types with active steps
      if (activeSteps.length > 0) {
        optimized[drumType] = activeSteps;
      }
    });

    return optimized;
  }

  /**
   * Get sequencer statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const stats = {
      totalSteps: this.options.patternLength,
      totalDrumTypes: this.options.drumTypes.length,
      activeSteps: 0,
      drumTypeStats: {}
    };

    this.grid.forEach((stepMap, drumType) => {
      let activeCount = 0;
      stepMap.forEach((isActive) => {
        if (isActive) activeCount++;
      });

      stats.activeSteps += activeCount;
      stats.drumTypeStats[drumType] = {
        active: activeCount,
        total: this.options.patternLength,
        percentage: Math.round((activeCount / this.options.patternLength) * 100)
      };
    });

    stats.totalActivePercentage = Math.round(
      (stats.activeSteps /
        (this.options.patternLength * this.options.drumTypes.length)) *
        100
    );

    return stats;
  }

  /**
   * Start playback visualization
   * @param {number} bpm - Beats per minute
   */
  startPlayback(bpm) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;

    const stepDuration = 60 / bpm / 4; // 16th note duration
    let lastStepTime = 0;

    const animate = (currentTime) => {
      if (!this.isPlaying) return;

      const elapsed = (currentTime - lastStepTime) / 1000;

      if (elapsed >= stepDuration) {
        this.highlightCurrentStep(this.currentStep);
        this.currentStep = (this.currentStep + 1) % this.options.patternLength;
        lastStepTime = currentTime;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Stop playback visualization
   */
  stopPlayback() {
    this.isPlaying = false;
    this.currentStep = 0;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Remove all step highlighting
    this.clearStepHighlighting();
  }

  /**
   * Highlight current step
   * @param {number} stepIndex - Step index to highlight
   * @private
   */
  highlightCurrentStep(stepIndex) {
    // Remove previous highlighting
    this.clearStepHighlighting();

    // Add current step highlighting
    this.options.drumTypes.forEach((drumType) => {
      const cell = this.container.querySelector(
        `[data-drum="${drumType}"][data-step="${stepIndex}"]`
      );
      if (cell) {
        cell.style.boxShadow = '0 0 10px var(--accent-color)';
        cell.style.transform = 'scale(1.1)';
        cell.style.transition = 'all 0.1s ease';
      }
    });
  }

  /**
   * Clear step highlighting
   * @private
   */
  clearStepHighlighting() {
    const cells = this.container.querySelectorAll('.grid-cell');
    cells.forEach((cell) => {
      cell.style.boxShadow = 'none';
      cell.style.transform = 'scale(1)';
    });
  }

  /**
   * Get sequencer state
   * @returns {Object} State object
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      patternLength: this.options.patternLength,
      drumTypes: this.options.drumTypes,
      gridData: this.getSequencerData(),
      statistics: this.getStatistics()
    };
  }

  /**
   * Destroy sequencer manager
   */
  destroy() {
    try {
      // Stop playback
      this.stopPlayback();

      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }

      // Clear data
      this.grid.clear();

      // Clear references
      this.container = null;
    } catch (error) {
      console.error('Error destroying sequencer manager:', error);
    }
  }
}

export default SequencerManager;
