/**
 * Local drum samples from the sounds folder
 * Users can select different sounds for each drum type
 */

// Available sound collections for each drum type
const SOUND_COLLECTIONS = {
    kick: {
        default: 'sounds/Kicks/Simple Kick.wav',
        options: [
            { name: 'Simple Kick', file: 'sounds/Kicks/Simple Kick.wav' },
            { name: 'Short Kick', file: 'sounds/Kicks/short_kick.wav' },
            { name: 'Stack Kick', file: 'sounds/Kicks/Stack_kick.wav' },
            { name: 'Reverb Kick', file: 'sounds/Kicks/reverb_kick.wav' },
            { name: 'Spring Kick', file: 'sounds/Kicks/Springlive_kick.wav' },
            { name: 'Break Kick', file: 'sounds/Kicks/shortbreak_kick.wav' },
            { name: 'PCP Kick 01', file: 'sounds/Kicks/pcp_kick01.wav' },
            { name: 'PCP Kick 02', file: 'sounds/Kicks/pcp_kick02.wav' },
            { name: 'PCP Kick 03', file: 'sounds/Kicks/pcp_kick03.wav' },
            { name: 'PCP Kick 04', file: 'sounds/Kicks/pcp_kick04.wav' },
            { name: 'PCP Kick 05', file: 'sounds/Kicks/pcp_kick05.wav' },
            { name: 'Stack Spring Kick', file: 'sounds/Kicks/stackspring_kick.wav' },
            { name: 'Stack Tom Kick', file: 'sounds/Kicks/stacktom_kick.wav' },
            { name: 'Royalty Kick', file: 'sounds/Kicks/Royalty Kick.wav' },
            { name: 'Rugged Kick', file: 'sounds/Kicks/Rugged Kick.wav' }
        ]
    },
    snare: {
        default: 'sounds/Snares/STACKERY_1.wav',
        options: [
            { name: 'Stack Snare', file: 'sounds/Snares/STACKERY_1.wav' },
            { name: 'Trap Snare', file: 'sounds/Snares/TRAP_SNR.wav' },
            { name: '808 Snare', file: 'sounds/Snares/TR808SN1.wav' },
            { name: 'Stack Snare 3', file: 'sounds/Snares/STACKERY_3.wav' },
            { name: 'Stack Snare 4', file: 'sounds/Snares/STACKERY_4.wav' },
            { name: 'Stack Snare 7', file: 'sounds/Snares/STACKERY_7.wav' },
            { name: 'Stack Snare 9', file: 'sounds/Snares/STACKERY_9.wav' },
            { name: 'Live Snare', file: 'sounds/Snares/Tamb_live_snr.wav' },
            { name: 'Rim Shot', file: 'sounds/Snares/TRY_RIM.wav' },
            { name: 'Soulful Snare', file: 'sounds/Snares/Soulful Snare.wav' },
            { name: 'Tough Snare', file: 'sounds/Snares/Tough Snare.wav' }
        ]
    },
    hihat: {
        default: 'sounds/Percs/T_HAT.wav',
        options: [
            { name: 'Simple Hi-Hat', file: 'sounds/Percs/T_HAT.wav' },
            { name: 'Closed Hi-Hat', file: 'sounds/Percs/T_CHH.wav' },
            { name: 'Open Hi-Hat', file: 'sounds/Percs/T_OHH.wav' },
            { name: 'Trap Hi-Hat', file: 'sounds/Percs/TrappyHats.wav' },
            { name: 'Tiny Hi-Hat', file: 'sounds/Percs/Tinny_HAT.wav' },
            { name: 'Tambourine Hi-Hat', file: 'sounds/Percs/TAMB_HATS.wav' },
            { name: 'Sweep Hi-Hat', file: 'sounds/Percs/sweepage_ (1).wav' },
            { name: 'Wood Block', file: 'sounds/Percs/WOODBVLOCK.wav' }
        ]
    },
    crash: {
        default: 'sounds/Shaker N Crashes/pcp_crash01.wav',
        options: [
            { name: 'Simple Crash', file: 'sounds/Shaker N Crashes/pcp_crash01.wav' },
            { name: 'PCP Crash 02', file: 'sounds/Shaker N Crashes/pcp_crash02.wav' },
            { name: 'PCP Crash 03', file: 'sounds/Shaker N Crashes/pcp_crash03.wav' },
            { name: 'PCP Crash 04', file: 'sounds/Shaker N Crashes/pcp_crash04.wav' },
            { name: 'PCP Crash 05', file: 'sounds/Shaker N Crashes/pcp_crash05.wav' },
            { name: 'PCP Cymbal', file: 'sounds/Shaker N Crashes/pcp_cymbal01.wav' },
            { name: 'Massive Crash', file: 'sounds/Shaker N Crashes/CRASHHH.wav' },
            { name: 'Kick Crash', file: 'sounds/Shaker N Crashes/KICKCRASH.wav' },
            { name: 'Crashola', file: 'sounds/Shaker N Crashes/Crashola.wav' },
            { name: 'Shaker I', file: 'sounds/Shaker N Crashes/SHAKER I.wav' },
            { name: 'Shaker II', file: 'sounds/Shaker N Crashes/SHAKER II.wav' }
        ]
    },
    tom1: {
        default: 'sounds/Percs/Tom_2.wav',
        options: [
            { name: 'Simple Tom', file: 'sounds/Percs/Tom_2.wav' },
            { name: 'Tom 3', file: 'sounds/Percs/Tom_3.wav' },
            { name: 'Tom 4', file: 'sounds/Percs/Tom_4.wav' },
            { name: 'Tom 5', file: 'sounds/Percs/Tom_5.wav' },
            { name: 'Tom 6', file: 'sounds/Percs/Tom_6.wav' },
            { name: 'Tom 7', file: 'sounds/Percs/Tom_7.wav' },
            { name: 'Tom 8', file: 'sounds/Percs/Tom_8.wav' },
            { name: 'Tom 9', file: 'sounds/Percs/Tom_9.wav' },
            { name: 'Tom 10', file: 'sounds/Percs/Tom_10.wav' },
            { name: 'Tom', file: 'sounds/Percs/Tom.wav' }
        ]
    },
    tom2: {
        default: 'sounds/Percs/Tom_3.wav',
        options: [
            { name: 'Simple Tom 2', file: 'sounds/Percs/Tom_3.wav' },
            { name: 'Tom 4', file: 'sounds/Percs/Tom_4.wav' },
            { name: 'Tom 5', file: 'sounds/Percs/Tom_5.wav' },
            { name: 'Tom 6', file: 'sounds/Percs/Tom_6.wav' },
            { name: 'Tom 7', file: 'sounds/Percs/Tom_7.wav' },
            { name: 'Tom 8', file: 'sounds/Percs/Tom_8.wav' },
            { name: 'Tom 9', file: 'sounds/Percs/Tom_9.wav' },
            { name: 'Tom 10', file: 'sounds/Percs/Tom_10.wav' },
            { name: 'Tom', file: 'sounds/Percs/Tom.wav' }
        ]
    },
    ride: {
        default: 'sounds/Percs/Ride_7.wav',
        options: [
            { name: 'Simple Ride', file: 'sounds/Percs/Ride_7.wav' },
            { name: 'Ride 8', file: 'sounds/Percs/Ride_8.wav' },
            { name: 'Ride 9', file: 'sounds/Percs/Ride_9.wav' },
            { name: 'Ride Loop 2', file: 'sounds/Percs/RIDE_LOOP_2.wav' },
            { name: 'Ride Loop 3', file: 'sounds/Percs/RIDE_LOOP_3.wav' },
            { name: 'Ride Loop 4', file: 'sounds/Percs/RIDE_LOOP_4.wav' },
            { name: 'Ride Loop 5', file: 'sounds/Percs/RIDE_LOOP_5.wav' },
            { name: 'Ride Loop 6', file: 'sounds/Percs/RIDE_LOOP_6.wav' }
        ]
    },
    clap: {
        default: 'sounds/Claps/pcp_clap01.wav',
        options: [
            { name: 'Simple Clap', file: 'sounds/Claps/pcp_clap01.wav' },
            { name: 'PCP Clap 02', file: 'sounds/Claps/pcp_clap02.wav' },
            { name: 'PCP Clap 03', file: 'sounds/Claps/pcp_clap03.wav' },
            { name: 'PCP Clap 04', file: 'sounds/Claps/pcp_clap04.wav' },
            { name: 'PCP Clap 05', file: 'sounds/Claps/pcp_clap05.wav' },
            { name: 'PCP Clap 06', file: 'sounds/Claps/pcp_clap06.wav' },
            { name: 'PCP Clap 07', file: 'sounds/Claps/pcp_clap07.wav' },
            { name: 'PCP Clap 08', file: 'sounds/Claps/pcp_clap08.wav' },
            { name: 'PCP Clap 09', file: 'sounds/Claps/pcp_clap09.wav' },
            { name: 'PCP Clap 10', file: 'sounds/Claps/pcp_clap10.wav' },
            { name: 'Massive Clap', file: 'sounds/Claps/MASSIVECLAP.wav' },
            { name: 'Clap Along', file: 'sounds/Claps/CLAP_ALONG.wav' },
            { name: 'Clap Wow', file: 'sounds/Claps/CLAP_WOW.wav' },
            { name: 'Clap Rockstar', file: 'sounds/Claps/CLAP_ROCKSTAR.wav' }
        ]
    }
};

// Current sound selections (stored in localStorage)
let currentSoundSelections = {};

// Initialize sound selections from localStorage or use defaults
function initializeSoundSelections() {
    const saved = localStorage.getItem('drumMachineSoundSelections');
    if (saved) {
        try {
            currentSoundSelections = JSON.parse(saved);
        } catch (error) {
            currentSoundSelections = {};
        }
    }
    
    // Set defaults for any missing selections
    Object.keys(SOUND_COLLECTIONS).forEach(drumType => {
        if (!currentSoundSelections[drumType]) {
            currentSoundSelections[drumType] = SOUND_COLLECTIONS[drumType].default;
        }
    });
    
    // Save initial selections
    saveSoundSelections();
}

// Save current sound selections to localStorage
function saveSoundSelections() {
    try {
        localStorage.setItem('drumMachineSoundSelections', JSON.stringify(currentSoundSelections));
    } catch (error) {
        // Silent error handling
    }
}

// Get current sound file for a drum type
function getCurrentSoundFile(drumType) {
    return currentSoundSelections[drumType] || SOUND_COLLECTIONS[drumType].default;
}

// Change sound for a drum type
function changeSound(drumType, soundFile) {
    currentSoundSelections[drumType] = soundFile;
    saveSoundSelections();
}

// Function to load a sample
async function loadSample(audioContext, drumType) {
    if (!SOUND_COLLECTIONS[drumType]) {
        return null;
    }

    try {
        const soundFile = getCurrentSoundFile(drumType);
        
        const response = await fetch(soundFile);
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } else {
            // Try to fall back to default sound if current selection failed
            const defaultSound = SOUND_COLLECTIONS[drumType].default;
            if (soundFile !== defaultSound) {
                const defaultResponse = await fetch(defaultSound);
                if (defaultResponse.ok) {
                    const arrayBuffer = await defaultResponse.arrayBuffer();
                    // Update selection to default
                    changeSound(drumType, defaultSound);
                    return await audioContext.decodeAudioData(arrayBuffer);
                }
            }
            
            return null;
        }
    } catch (error) {
        return null;
    }
}

// Initialize sound selections when the module loads
initializeSoundSelections();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        SOUND_COLLECTIONS, 
        loadSample, 
        getCurrentSoundFile, 
        changeSound,
        currentSoundSelections 
    };
}
