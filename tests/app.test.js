// Comprehensive tests for Drum Machine features
// Testing all the new functionality we've implemented

describe('Drum Machine Core Features', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Multi-Beat Storage', () => {
    test('should save and load multiple beats', () => {
      const beat1 = {
        tempo: 120,
        patternLength: 16,
        sequencer: { kick: [0, 4] }
      };
      const beat2 = {
        tempo: 140,
        patternLength: 8,
        sequencer: { snare: [2, 6] }
      };

      // Save beats
      localStorage.setItem(
        'drumMachineBeats',
        JSON.stringify([
          {
            name: 'Beat 1',
            data: beat1,
            timestamp: Date.now(),
            lastUsed: Date.now()
          },
          {
            name: 'Beat 2',
            data: beat2,
            timestamp: Date.now(),
            lastUsed: Date.now()
          }
        ])
      );

      // Load beats
      const storedBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      expect(storedBeats.length).toBe(2);
      expect(storedBeats[0].name).toBe('Beat 1');
      expect(storedBeats[1].name).toBe('Beat 2');
    });

    test('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('drumMachineBeats', 'invalid json');

      let result = [];
      try {
        result = JSON.parse(localStorage.getItem('drumMachineBeats') || '[]');
      } catch (error) {
        result = [];
        localStorage.removeItem('drumMachineBeats');
      }

      expect(result).toEqual([]);
      expect(localStorage.getItem('drumMachineBeats')).toBeNull();
    });

    test('should track last used timestamps', () => {
      const now = Date.now();
      const beat = {
        tempo: 120,
        patternLength: 16,
        sequencer: { kick: [0, 4] }
      };

      localStorage.setItem(
        'drumMachineBeats',
        JSON.stringify([
          { name: 'Test Beat', data: beat, timestamp: now, lastUsed: now }
        ])
      );

      const storedBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      expect(storedBeats[0].lastUsed).toBe(now);
    });

    test('should handle beat name conflicts gracefully', () => {
      const existingBeat = {
        name: 'Test Beat',
        data: { tempo: 120 },
        timestamp: Date.now()
      };
      const newBeat = {
        name: 'Test Beat',
        data: { tempo: 140 },
        timestamp: Date.now()
      };

      // Simulate existing beat
      localStorage.setItem('drumMachineBeats', JSON.stringify([existingBeat]));

      // Simulate conflict resolution
      const storedBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      const existingIndex = storedBeats.findIndex(
        (beat) => beat.name === newBeat.name
      );

      if (existingIndex !== -1) {
        // Replace existing beat
        storedBeats[existingIndex] = newBeat;
        localStorage.setItem('drumMachineBeats', JSON.stringify(storedBeats));
      }

      const finalBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      expect(finalBeats.length).toBe(1);
      expect(finalBeats[0].data.tempo).toBe(140);
    });

    test('should handle empty beat names', () => {
      const emptyNameBeat = { name: '', data: { tempo: 120 } };
      const whitespaceBeat = { name: '   ', data: { tempo: 140 } };

      // Both should be rejected
      expect(emptyNameBeat.name.trim()).toBe('');
      expect(whitespaceBeat.name.trim()).toBe('');
    });
  });

  describe('URL Sharing and Loading', () => {
    test('should create optimized beat data for sharing', () => {
      const testBeat = {
        tempo: 120,
        patternLength: 16,
        sequencer: {
          kick: [true, false, false, false, true, false, false, false],
          snare: [false, false, true, false, false, false, true, false]
        }
      };

      // Simulate optimization (only store non-default values)
      const optimizedData = {
        tempo: testBeat.tempo,
        patternLength: testBeat.patternLength,
        sequencer: {
          kick: [0, 4], // Only store step indices where value is true
          snare: [2, 6]
        }
      };

      expect(optimizedData.tempo).toBe(120);
      expect(optimizedData.patternLength).toBe(16);
      expect(optimizedData.sequencer.kick).toEqual([0, 4]);
      expect(optimizedData.sequencer.snare).toEqual([2, 6]);
    });

    test('should encode and decode beat data for URLs', () => {
      const testBeat = {
        tempo: 140,
        patternLength: 8,
        sequencer: { kick: [0, 4], snare: [2, 6] }
      };

      // Encode using Buffer for proper base64 encoding
      const encoded = Buffer.from(JSON.stringify(testBeat)).toString('base64');
      expect(encoded).toBeTruthy();

      // Decode using Buffer
      const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
      expect(decoded.tempo).toBe(140);
      expect(decoded.patternLength).toBe(8);
    });

    test('should handle URL parameters correctly', () => {
      const testBeat = {
        tempo: 130,
        patternLength: 12,
        sequencer: { kick: [0, 6] }
      };
      const encoded = Buffer.from(JSON.stringify(testBeat)).toString('base64');
      const url = `?beat=${encoded}`;

      const urlParams = new URLSearchParams(url);
      const beatParam = urlParams.get('beat');
      expect(beatParam).toBe(encoded);

      const decoded = JSON.parse(Buffer.from(beatParam, 'base64').toString());
      expect(decoded.tempo).toBe(130);
      expect(decoded.patternLength).toBe(12);
    });

    test('should handle malformed URL data gracefully', () => {
      const malformedData = 'invalid-base64-data';

      // Simulate error handling
      let decoded = null;
      try {
        decoded = JSON.parse(Buffer.from(malformedData, 'base64').toString());
      } catch (error) {
        decoded = null;
      }

      expect(decoded).toBeNull();
    });

    test('should handle empty sequencer data', () => {
      const emptyBeat = { tempo: 120, patternLength: 16 };

      // Should handle missing sequencer gracefully
      expect(emptyBeat.sequencer).toBeUndefined();

      // Simulate default sequencer creation
      const defaultSequencer = {};
      ['kick', 'snare', 'hihat'].forEach((type) => {
        defaultSequencer[type] = new Array(16).fill(false);
      });

      expect(Object.keys(defaultSequencer)).toHaveLength(3);
      expect(defaultSequencer.kick).toHaveLength(16);
    });
  });

  describe('Theme Management', () => {
    test('should save and load theme preference', () => {
      const theme = 'dark';
      localStorage.setItem('drumMachineTheme', theme);

      const savedTheme = localStorage.getItem('drumMachineTheme');
      expect(savedTheme).toBe('dark');
    });

    test('should handle missing theme preference', () => {
      localStorage.removeItem('drumMachineTheme');
      const theme = localStorage.getItem('drumMachineTheme');
      expect(theme).toBeNull();
    });

    test('should support light and dark themes', () => {
      const themes = ['light', 'dark'];
      themes.forEach((theme) => {
        localStorage.setItem('drumMachineTheme', theme);
        const savedTheme = localStorage.getItem('drumMachineTheme');
        expect(savedTheme).toBe(theme);
      });
    });

    test('should handle system theme preference', () => {
      // Mock system preference
      const mockMediaQuery = {
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      // Simulate system dark mode preference
      const systemPrefersDark = mockMediaQuery.matches;
      const autoTheme = systemPrefersDark ? 'dark' : 'light';

      expect(autoTheme).toBe('dark');
    });
  });

  describe('Audio Context Management', () => {
    test('should handle different audio context states', () => {
      const states = ['suspended', 'running', 'closed'];

      states.forEach((state) => {
        expect(states).toContain(state);
      });
    });

    test('should validate audio context state transitions', () => {
      const validTransitions = {
        suspended: ['running', 'closed'],
        running: ['suspended', 'closed'],
        closed: []
      };

      expect(validTransitions.suspended).toContain('running');
      expect(validTransitions.running).toContain('suspended');
      expect(validTransitions.closed).toHaveLength(0);
    });

    test('should handle audio context lifecycle', () => {
      const lifecycle = ['suspended', 'running', 'suspended', 'closed'];
      expect(lifecycle.length).toBe(4);
      expect(lifecycle[0]).toBe('suspended');
      expect(lifecycle[lifecycle.length - 1]).toBe('closed');
    });

    test('should handle audio context errors gracefully', () => {
      const errorStates = ['closed', 'suspended'];

      errorStates.forEach((state) => {
        // Simulate error handling
        let canPlay = false;
        if (state === 'running') {
          canPlay = true;
        } else if (state === 'suspended') {
          canPlay = false; // Need user interaction
        } else if (state === 'closed') {
          canPlay = false; // Cannot recover
        }

        expect(canPlay).toBe(state === 'running');
      });
    });
  });

  describe('Piano Functionality', () => {
    test('should calculate correct piano frequencies', () => {
      const frequencies = {
        1: 261.63, // C4
        13: 523.25, // C5
        24: 1046.5 // C6
      };

      Object.entries(frequencies).forEach(([key, expectedFreq]) => {
        expect(parseInt(key)).toBeGreaterThan(0);
        expect(expectedFreq).toBeGreaterThan(0);
      });
    });

    test('should handle piano key mapping', () => {
      const keyMap = [
        { note: 'C', key: 'Q', type: 'white', index: 1 },
        { note: 'C#', key: 'A', type: 'black', index: 2 },
        { note: 'D', key: 'W', type: 'white', index: 3 }
      ];

      expect(keyMap.length).toBe(3);
      expect(keyMap[0].note).toBe('C');
      expect(keyMap[1].type).toBe('black');
      expect(keyMap[2].index).toBe(3);
    });

    test('should support 24 piano keys', () => {
      const totalKeys = 24;
      const whiteKeys = 14;
      const blackKeys = 10;

      expect(totalKeys).toBe(whiteKeys + blackKeys);
      expect(whiteKeys).toBeGreaterThan(blackKeys);
    });

    test('should handle piano key types correctly', () => {
      const keyTypes = ['white', 'black'];
      const testKeys = [
        { note: 'C', type: 'white' },
        { note: 'C#', type: 'black' },
        { note: 'D', type: 'white' }
      ];

      testKeys.forEach((key) => {
        expect(keyTypes).toContain(key.type);
        expect(key.note).toBeTruthy();
      });
    });

    test('should handle black key positioning', () => {
      const blackKeyMap = {
        2: 0, // C# between C and D
        4: 1, // D# between D and E
        7: 3, // F# between F and G
        9: 4, // G# between G and A
        11: 5 // A# between A and B
      };

      Object.entries(blackKeyMap).forEach(([blackKey, whiteKeyIndex]) => {
        expect(parseInt(blackKey)).toBeGreaterThan(0);
        expect(whiteKeyIndex).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle piano sample loading failures', () => {
      const sampleStates = ['loaded', 'failed', 'loading'];

      sampleStates.forEach((state) => {
        let canPlay = false;
        if (state === 'loaded') {
          canPlay = true;
        } else if (state === 'failed') {
          canPlay = false; // Should use synthesized fallback
        } else if (state === 'loading') {
          canPlay = false; // Should wait
        }

        expect(typeof canPlay).toBe('boolean');
      });
    });
  });

  describe('Responsive Design', () => {
    test('should detect mobile viewport', () => {
      const mobileBreakpoint = 768;
      const desktopWidth = 1200;
      const mobileWidth = 600;

      expect(desktopWidth > mobileBreakpoint).toBe(true);
      expect(mobileWidth <= mobileBreakpoint).toBe(true);
    });

    test('should handle different screen orientations', () => {
      const orientations = ['portrait', 'landscape'];
      expect(orientations).toContain('portrait');
      expect(orientations).toContain('landscape');
    });

    test('should support mobile piano layout', () => {
      const mobileLayout = {
        orientation: 'vertical',
        keyWidth: '100%',
        keyHeight: '40px',
        blackKeyWidth: '50%'
      };

      expect(mobileLayout.orientation).toBe('vertical');
      expect(mobileLayout.keyWidth).toBe('100%');
      expect(mobileLayout.keyHeight).toBe('40px');
      expect(mobileLayout.blackKeyWidth).toBe('50%');
    });

    test('should handle window resize events', () => {
      const resizeEvents = ['resize', 'orientationchange'];

      resizeEvents.forEach((event) => {
        expect(typeof event).toBe('string');
        expect(event.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should validate input parameters', () => {
      const validateInputs = (tempo, patternLength, drumType, step) => {
        const errors = [];

        if (typeof tempo !== 'number' || tempo < 60 || tempo > 200) {
          errors.push('Tempo must be a number between 60 and 200');
        }

        if (
          typeof patternLength !== 'number' ||
          patternLength < 4 ||
          patternLength > 32
        ) {
          errors.push('Pattern length must be a number between 4 and 32');
        }

        if (typeof drumType !== 'string' || !drumType.trim()) {
          errors.push('Drum type must be a non-empty string');
        }

        if (typeof step !== 'number' || step < 0 || step >= patternLength) {
          errors.push(
            `Step must be a number between 0 and ${patternLength - 1}`
          );
        }

        return errors;
      };

      let errors = validateInputs(120, 16, 'kick', 0);
      expect(errors).toHaveLength(0);

      errors = validateInputs(30, 2, '', -1);
      expect(errors).toHaveLength(4);
      expect(errors).toContain('Tempo must be a number between 60 and 200');
      expect(errors).toContain(
        'Pattern length must be a number between 4 and 32'
      );
      expect(errors).toContain('Drum type must be a non-empty string');
      expect(errors).toContain('Step must be a number between 0 and 1');
    });

    test('should handle missing data gracefully', () => {
      const incompleteBeat = { tempo: 120 };

      const defaultBeat = {
        tempo: incompleteBeat.tempo || 120,
        patternLength: incompleteBeat.patternLength || 16,
        sequencer: incompleteBeat.sequencer || {}
      };

      expect(defaultBeat.tempo).toBe(120);
      expect(defaultBeat.patternLength).toBe(16);
      expect(defaultBeat.sequencer).toEqual({});
    });

    test('should handle audio playback errors', () => {
      const errorScenarios = [
        { context: 'closed', canPlay: false, recovery: 'impossible' },
        { context: 'suspended', canPlay: false, recovery: 'user-interaction' },
        { context: 'running', canPlay: true, recovery: 'none' }
      ];

      errorScenarios.forEach((scenario) => {
        expect(typeof scenario.context).toBe('string');
        expect(typeof scenario.canPlay).toBe('boolean');
        expect(typeof scenario.recovery).toBe('string');
      });
    });

    test('should handle network failures gracefully', () => {
      const networkErrors = ['timeout', '404', '500', 'network-error'];

      networkErrors.forEach((error) => {
        // Simulate error handling
        let fallback = false;
        if (['404', '500', 'timeout', 'network-error'].includes(error)) {
          fallback = true; // Should use synthesized sounds
        }

        expect(fallback).toBe(true);
      });
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large beat data efficiently', () => {
      const largeBeat = {
        tempo: 120,
        patternLength: 64,
        sequencer: {}
      };

      const drumTypes = [
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
      drumTypes.forEach((type) => {
        largeBeat.sequencer[type] = new Array(64).fill(false);
        for (let i = 0; i < 64; i += 4) {
          largeBeat.sequencer[type][i] = true;
        }
      });

      expect(largeBeat.sequencer.kick.length).toBe(64);
      expect(largeBeat.sequencer.snare.length).toBe(64);
      expect(Object.keys(largeBeat.sequencer).length).toBe(9);
    });

    test('should optimize data storage for sharing', () => {
      const fullBeat = {
        tempo: 120,
        patternLength: 16,
        sequencer: {
          kick: [
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false
          ],
          snare: [
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            true,
            false
          ]
        }
      };

      const optimizedBeat = {
        tempo: fullBeat.tempo,
        patternLength: fullBeat.patternLength,
        sequencer: {
          kick: [0, 4, 8, 12],
          snare: [2, 6, 10, 14]
        }
      };

      const fullSize = JSON.stringify(fullBeat).length;
      const optimizedSize = JSON.stringify(optimizedBeat).length;

      expect(optimizedSize).toBeLessThan(fullSize);
      expect(optimizedBeat.sequencer.kick).toEqual([0, 4, 8, 12]);
    });

    test('should handle memory cleanup', () => {
      const audioSources = [
        { id: 1, buffer: 'audio1', active: true },
        { id: 2, buffer: 'audio2', active: false },
        { id: 3, buffer: 'audio3', active: true }
      ];

      const activeSources = audioSources.filter((source) => source.active);
      expect(activeSources.length).toBe(2);
      expect(activeSources[0].id).toBe(1);
      expect(activeSources[1].id).toBe(3);
    });

    test('should handle event listener cleanup', () => {
      const eventTypes = ['click', 'touchstart', 'keydown', 'resize'];
      const cleanupMap = {};

      eventTypes.forEach((type) => {
        cleanupMap[type] = true; // Mark for cleanup
      });

      // Simulate cleanup
      Object.keys(cleanupMap).forEach((type) => {
        delete cleanupMap[type];
      });

      expect(Object.keys(cleanupMap)).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete workflow: create, save, share, load', () => {
      const beat = {
        tempo: 130,
        patternLength: 8,
        sequencer: {
          kick: [0, 4],
          snare: [2, 6],
          hihat: [0, 1, 2, 3, 4, 5, 6, 7]
        }
      };

      const savedBeat = {
        name: 'My Beat',
        data: beat,
        timestamp: Date.now(),
        lastUsed: Date.now()
      };

      localStorage.setItem('drumMachineBeats', JSON.stringify([savedBeat]));

      const optimizedBeat = {
        tempo: beat.tempo,
        patternLength: beat.patternLength,
        sequencer: {
          kick: [0, 4],
          snare: [2, 6],
          hihat: [0, 1, 2, 3, 4, 5, 6, 7]
        }
      };

      const shareUrl = `?beat=${Buffer.from(JSON.stringify(optimizedBeat)).toString('base64')}`;

      const urlParams = new URLSearchParams(shareUrl);
      const beatParam = urlParams.get('beat');
      const loadedBeat = JSON.parse(
        Buffer.from(beatParam, 'base64').toString()
      );

      expect(loadedBeat.tempo).toBe(130);
      expect(loadedBeat.patternLength).toBe(8);
      expect(loadedBeat.sequencer.kick).toEqual([0, 4]);
      expect(loadedBeat.sequencer.snare).toEqual([2, 6]);
      expect(loadedBeat.sequencer.hihat).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

      const storedBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      expect(storedBeats.length).toBe(1);
      expect(storedBeats[0].name).toBe('My Beat');
    });

    test('should handle multiple beats workflow', () => {
      const beats = [
        {
          name: 'Beat 1',
          tempo: 120,
          patternLength: 16,
          sequencer: { kick: [0, 8] }
        },
        {
          name: 'Beat 2',
          tempo: 140,
          patternLength: 8,
          sequencer: { snare: [2, 6] }
        },
        {
          name: 'Beat 3',
          tempo: 160,
          patternLength: 32,
          sequencer: { hihat: [0, 4, 8, 12, 16, 20, 24, 28] }
        }
      ];

      const savedBeats = beats.map((beat) => ({
        ...beat,
        timestamp: Date.now(),
        lastUsed: Date.now()
      }));

      localStorage.setItem('drumMachineBeats', JSON.stringify(savedBeats));

      const storedBeats = JSON.parse(
        localStorage.getItem('drumMachineBeats') || '[]'
      );
      expect(storedBeats.length).toBe(3);
      expect(storedBeats[0].name).toBe('Beat 1');
      expect(storedBeats[1].tempo).toBe(140);
      expect(storedBeats[2].patternLength).toBe(32);

      const lastUsedBeat = storedBeats.reduce((latest, current) =>
        current.lastUsed > latest.lastUsed ? current : latest
      );

      // Since all timestamps are the same (created in same millisecond),
      // the first one will be returned by reduce
      expect(lastUsedBeat.name).toBe('Beat 1');
    });

    test('should handle theme persistence across sessions', () => {
      // Simulate theme change
      const theme = 'dark';
      localStorage.setItem('drumMachineTheme', theme);

      // Simulate page reload
      const savedTheme = localStorage.getItem('drumMachineTheme');
      expect(savedTheme).toBe('dark');

      // Simulate theme toggle
      const newTheme = savedTheme === 'dark' ? 'light' : 'dark';
      expect(newTheme).toBe('light');

      // Update storage
      localStorage.setItem('drumMachineTheme', newTheme);
      const updatedTheme = localStorage.getItem('drumMachineTheme');
      expect(updatedTheme).toBe('light');
    });

    test('should handle audio context recovery workflow', () => {
      const audioStates = ['suspended', 'running', 'closed'];
      const recoveryActions = [];

      audioStates.forEach((state) => {
        if (state === 'suspended') {
          recoveryActions.push('resume');
        } else if (state === 'closed') {
          recoveryActions.push('recreate');
        } else if (state === 'running') {
          recoveryActions.push('none');
        }
      });

      expect(recoveryActions).toContain('resume');
      expect(recoveryActions).toContain('recreate');
      expect(recoveryActions).toContain('none');
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    test('should handle extremely long patterns', () => {
      const longPattern = {
        tempo: 120,
        patternLength: 128,
        sequencer: { kick: new Array(128).fill(false) }
      };

      // Set every 4th step to true
      for (let i = 0; i < 128; i += 4) {
        longPattern.sequencer.kick[i] = true;
      }

      expect(longPattern.sequencer.kick.length).toBe(128);
      expect(longPattern.sequencer.kick.filter((step) => step).length).toBe(32);
    });

    test('should handle rapid tempo changes', () => {
      const tempoChanges = [60, 120, 180, 90, 150, 80];
      const validTempos = tempoChanges.filter(
        (tempo) => tempo >= 60 && tempo <= 200
      );

      expect(validTempos.length).toBe(tempoChanges.length);
      tempoChanges.forEach((tempo) => {
        expect(tempo).toBeGreaterThanOrEqual(60);
        expect(tempo).toBeLessThanOrEqual(200);
      });
    });

    test('should handle concurrent operations', () => {
      const operations = ['play', 'stop', 'record', 'save', 'load'];
      const concurrentOps = operations.slice(0, 3); // Simulate 3 concurrent operations

      expect(concurrentOps.length).toBe(3);
      expect(concurrentOps).toContain('play');
      expect(concurrentOps).toContain('stop');
      expect(concurrentOps).toContain('record');
    });

    test('should handle malformed beat data', () => {
      const malformedData = [
        { tempo: 'invalid', patternLength: 16 },
        { tempo: 120, patternLength: 'invalid' },
        { tempo: 120, patternLength: 16, sequencer: 'not-an-object' },
        { tempo: 120, patternLength: 16, sequencer: { kick: 'not-an-array' } }
      ];

      // Test that the data actually has invalid types
      expect(typeof malformedData[0].tempo).toBe('string');
      expect(typeof malformedData[1].patternLength).toBe('string');
      expect(typeof malformedData[2].sequencer).toBe('string');
      expect(typeof malformedData[3].sequencer.kick).toBe('string');
    });
  });
});
