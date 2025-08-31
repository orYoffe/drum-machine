import {
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES
} from '../config/constants.js';

/**
 * ModalManager Class
 * Handles all modal functionality including beat selection, save dialogs,
 * modal state management, and event handling
 */
export class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.modalBackdrop = null;
    this.isInitialized = false;

    // Modal templates
    this.templates = {
      beatSelection: this.createBeatSelectionTemplate(),
      saveBeat: this.createSaveBeatTemplate()
    };

    // Bind methods to preserve context
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);

    // Initialize modal system
    this.initialize();
  }

  /**
   * Initialize modal system
   * @returns {boolean} Success status
   */
  initialize() {
    try {
      // Create modal backdrop
      this.createModalBackdrop();

      // Bind global events
      this.bindGlobalEvents();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing modal manager:', error);
      return false;
    }
  }

  /**
   * Create modal backdrop
   * @private
   */
  createModalBackdrop() {
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.className = 'modal-backdrop';
    this.modalBackdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, ${UI_CONFIG.MODAL_BACKDROP_OPACITY});
      z-index: 9998;
      opacity: 0;
      visibility: hidden;
      transition: opacity ${UI_CONFIG.ANIMATION_DURATION}ms ease, visibility ${UI_CONFIG.ANIMATION_DURATION}ms ease;
    `;

    this.modalBackdrop.addEventListener('click', this.handleBackdropClick);
    document.body.appendChild(this.modalBackdrop);
  }

  /**
   * Bind global events
   * @private
   */
  bindGlobalEvents() {
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  /**
   * Show beat selection modal
   * @param {Array} beats - Array of beat objects
   * @param {Function} onBeatSelect - Callback when beat is selected
   * @returns {boolean} Success status
   */
  showBeatSelectionModal(beats = [], onBeatSelect = null) {
    try {
      const modalId = 'beat-selection-modal';

      // Create or get modal
      let modal = this.modals.get(modalId);
      if (!modal) {
        modal = this.createModal(modalId, this.templates.beatSelection);
        this.modals.set(modalId, modal);
      }

      // Populate beat list
      this.populateBeatList(modal, beats);

      // Set callback
      if (onBeatSelect && typeof onBeatSelect === 'function') {
        modal.dataset.onBeatSelect = 'true';
        modal.onBeatSelect = onBeatSelect;
      }

      // Show modal
      this.showModal(modal);

      return true;
    } catch (error) {
      console.error('Error showing beat selection modal:', error);
      return false;
    }
  }

  /**
   * Hide beat selection modal
   * @returns {boolean} Success status
   */
  hideBeatSelectionModal() {
    return this.hideModal('beat-selection-modal');
  }

  /**
   * Show save beat modal
   * @param {Object} beatData - Beat data to save
   * @param {Function} onSave - Callback when beat is saved
   * @returns {boolean} Success status
   */
  showSaveBeatModal(beatData = {}, onSave = null) {
    try {
      const modalId = 'save-beat-modal';

      // Create or get modal
      let modal = this.modals.get(modalId);
      if (!modal) {
        modal = this.createModal(modalId, this.templates.saveBeat);
        this.modals.set(modalId, modal);
      }

      // Set beat data
      modal.dataset.beatData = JSON.stringify(beatData);

      // Set callback
      if (onSave && typeof onSave === 'function') {
        modal.dataset.onSave = 'true';
        modal.onSave = onSave;
      }

      // Show modal
      this.showModal(modal);

      return true;
    } catch (error) {
      console.error('Error showing save beat modal:', error);
      return false;
    }
  }

  /**
   * Hide save beat modal
   * @returns {boolean} Success status
   */
  hideSaveBeatModal() {
    return this.hideModal('save-beat-modal');
  }

  /**
   * Create modal element
   * @param {string} modalId - Modal identifier
   * @param {string} template - Modal HTML template
   * @returns {HTMLElement} Modal element
   * @private
   */
  createModal(modalId, template) {
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.innerHTML = template;

    // Set modal styles
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background-color: var(--background-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: all ${UI_CONFIG.ANIMATION_DURATION}ms ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    // Add close button event
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleModalClose(modal));
    }

    // Add form submit event
    const form = modal.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e, modal));
    }

    return modal;
  }

  /**
   * Create beat selection modal template
   * @returns {string} HTML template
   * @private
   */
  createBeatSelectionTemplate() {
    return `
      <div class="modal-header">
        <h3>Load Beat</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="beat-list">
          <p class="no-beats-message" style="display: none; color: var(--text-secondary); text-align: center;">
            No saved beats found. Create and save a beat first.
          </p>
          <div class="beat-items"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').dispatchEvent(new Event('close'))">
          Cancel
        </button>
      </div>
    `;
  }

  /**
   * Create save beat modal template
   * @returns {string} HTML template
   * @private
   */
  createSaveBeatTemplate() {
    return `
      <div class="modal-header">
        <h3>Save Beat</h3>
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <form class="save-beat-form">
          <div class="form-group">
            <label for="beat-name">Beat Name:</label>
            <input type="text" id="beat-name" name="beatName" required 
                   maxlength="${VALIDATION_RULES.BEAT_NAME.maxLength}" 
                   placeholder="Enter a name for your beat">
            <div class="error-message" style="display: none; color: var(--error-color); font-size: 12px;"></div>
          </div>
          <div class="form-group">
            <label for="beat-description">Description (optional):</label>
            <textarea id="beat-description" name="beatDescription" 
                      placeholder="Add a description for your beat"></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').dispatchEvent(new Event('close'))">
          Cancel
        </button>
        <button type="submit" form="save-beat-form" class="btn btn-primary">
          Save Beat
        </button>
      </div>
    `;
  }

  /**
   * Populate beat list in selection modal
   * @param {HTMLElement} modal - Modal element
   * @param {Array} beats - Array of beat objects
   * @private
   */
  populateBeatList(modal, beats) {
    const beatItems = modal.querySelector('.beat-items');
    const noBeatsMessage = modal.querySelector('.no-beats-message');

    if (!beatItems) return;

    // Clear existing items
    beatItems.innerHTML = '';

    if (!beats || beats.length === 0) {
      if (noBeatsMessage) {
        noBeatsMessage.style.display = 'block';
      }
      return;
    }

    if (noBeatsMessage) {
      noBeatsMessage.style.display = 'none';
    }

    // Create beat items
    beats.forEach((beat) => {
      const beatItem = document.createElement('div');
      beatItem.className = 'beat-item';
      beatItem.style.cssText = `
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      `;

      beatItem.innerHTML = `
        <div class="beat-name" style="font-weight: bold; margin-bottom: 4px;">${beat.name}</div>
        <div class="beat-info" style="font-size: 12px; color: var(--text-secondary);">
          Tempo: ${beat.data?.tempo || 'N/A'} BPM | 
          Pattern: ${beat.data?.patternLength || 'N/A'} steps |
          Last used: ${new Date(beat.lastUsed).toLocaleDateString()}
        </div>
      `;

      // Add click handler
      beatItem.addEventListener('click', () => {
        this.handleBeatSelection(modal, beat);
      });

      // Add hover effects
      beatItem.addEventListener('mouseenter', () => {
        beatItem.style.backgroundColor = 'var(--background-secondary)';
      });

      beatItem.addEventListener('mouseleave', () => {
        beatItem.style.backgroundColor = 'transparent';
      });

      beatItems.appendChild(beatItem);
    });
  }

  /**
   * Handle beat selection
   * @param {HTMLElement} modal - Modal element
   * @param {Object} beat - Selected beat
   * @private
   */
  handleBeatSelection(modal, beat) {
    if (modal.onBeatSelect && typeof modal.onBeatSelect === 'function') {
      modal.onBeatSelect(beat);
    }

    this.hideModal(modal.id);
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  handleFormSubmit(event, modal) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const beatName = formData.get('beatName')?.trim();
    const beatDescription = formData.get('beatDescription')?.trim();

    // Validate beat name
    if (!beatName || beatName.length < VALIDATION_RULES.BEAT_NAME.minLength) {
      this.showFormError(modal, ERROR_MESSAGES.BEAT_NAME_EMPTY);
      return;
    }

    if (beatName.length > VALIDATION_RULES.BEAT_NAME.maxLength) {
      this.showFormError(
        modal,
        `Beat name too long (max ${VALIDATION_RULES.BEAT_NAME.maxLength} characters)`
      );
      return;
    }

    // Get beat data
    let beatData = {};
    try {
      beatData = JSON.parse(modal.dataset.beatData || '{}');
    } catch (error) {
      console.error('Error parsing beat data:', error);
      beatData = {};
    }

    // Create save data
    const saveData = {
      name: beatName,
      description: beatDescription,
      data: beatData
    };

    // Call save callback
    if (modal.onSave && typeof modal.onSave === 'function') {
      const result = modal.onSave(saveData);

      if (result && result.success) {
        this.hideModal(modal.id);
      } else {
        this.showFormError(modal, result?.message || 'Failed to save beat');
      }
    }
  }

  /**
   * Show form error message
   * @param {HTMLElement} modal - Modal element
   * @param {string} message - Error message
   * @private
   */
  showFormError(modal, message) {
    const errorElement = modal.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      // Hide error after 5 seconds
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show modal
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  showModal(modal) {
    if (this.activeModal) {
      this.hideModal(this.activeModal.id);
    }

    // Add modal to DOM
    document.body.appendChild(modal);

    // Show backdrop
    if (this.modalBackdrop) {
      this.modalBackdrop.style.visibility = 'visible';
      this.modalBackdrop.style.opacity = '1';
    }

    // Show modal with animation
    requestAnimationFrame(() => {
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    this.activeModal = modal;

    // Focus first input
    const firstInput = modal.querySelector('input, textarea, button');
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal identifier
   * @returns {boolean} Success status
   */
  hideModal(modalId) {
    try {
      const modal =
        typeof modalId === 'string' ? this.modals.get(modalId) : modalId;
      if (!modal) return false;

      // Hide modal with animation
      modal.style.opacity = '0';
      modal.style.transform = 'translate(-50%, -50%) scale(0.9)';

      setTimeout(() => {
        modal.style.visibility = 'hidden';

        // Remove from DOM
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }

        // Hide backdrop if no other modals
        if (this.activeModal === modal) {
          this.activeModal = null;
          if (this.modalBackdrop) {
            this.modalBackdrop.style.opacity = '0';
            setTimeout(() => {
              this.modalBackdrop.style.visibility = 'hidden';
            }, UI_CONFIG.ANIMATION_DURATION);
          }
        }
      }, UI_CONFIG.ANIMATION_DURATION);

      return true;
    } catch (error) {
      console.error('Error hiding modal:', error);
      return false;
    }
  }

  /**
   * Handle modal close
   * @param {HTMLElement} modal - Modal element
   * @private
   */
  handleModalClose(modal) {
    this.hideModal(modal.id);
  }

  /**
   * Handle backdrop click
   * @param {Event} event - Click event
   * @private
   */
  handleBackdropClick(event) {
    if (event.target === this.modalBackdrop && this.activeModal) {
      this.hideModal(this.activeModal.id);
    }
  }

  /**
   * Handle escape key
   * @param {KeyboardEvent} event - Keydown event
   * @private
   */
  handleEscapeKey(event) {
    if (event.key === 'Escape' && this.activeModal) {
      this.hideModal(this.activeModal.id);
    }
  }

  /**
   * Get selected beat from selection modal
   * @returns {Object|null} Selected beat or null
   */
  getSelectedBeat() {
    // This would be implemented based on the specific modal implementation
    // For now, return null as selection is handled via callback
    return null;
  }

  /**
   * Get save beat data from save modal
   * @returns {Object|null} Save data or null
   */
  getSaveBeatData() {
    // This would be implemented based on the specific modal implementation
    // For now, return null as save is handled via callback
    return null;
  }

  /**
   * Check if modal is visible
   * @param {string} modalId - Modal identifier
   * @returns {boolean} Visibility status
   */
  isModalVisible(modalId) {
    const modal = this.modals.get(modalId);
    return modal && modal.style.visibility === 'visible';
  }

  /**
   * Get modal state
   * @returns {Object} State object
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      activeModal: this.activeModal?.id || null,
      totalModals: this.modals.size,
      visibleModals: Array.from(this.modals.keys()).filter((id) =>
        this.isModalVisible(id)
      )
    };
  }

  /**
   * Destroy modal manager
   */
  destroy() {
    try {
      // Hide all modals
      this.modals.forEach((modal, modalId) => {
        this.hideModal(modalId);
      });

      // Remove backdrop
      if (this.modalBackdrop && this.modalBackdrop.parentNode) {
        this.modalBackdrop.parentNode.removeChild(this.modalBackdrop);
      }

      // Remove global event listeners
      document.removeEventListener('keydown', this.handleEscapeKey);

      // Clear references
      this.modals.clear();
      this.activeModal = null;
      this.modalBackdrop = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error destroying modal manager:', error);
    }
  }
}

export default ModalManager;
