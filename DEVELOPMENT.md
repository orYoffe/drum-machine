# 🛠️ Development Guide

This document provides technical details for developers who want to contribute to the Drum Machine project.

## 🎵 Core Features

### Drum Sequencer

- **8 Drum Types**: Kick, Snare, Hi-Hat, Crash, Tom 1, Tom 2, Ride, Clap
- **Step Sequencer**: Grid-based pattern programming with visual feedback
- **Pattern Lengths**: Configurable 8, 16, or 32 steps
- **Tempo Control**: Real-time BPM adjustment (60-200)

### Audio Engine

- **Web Audio API**: High-quality audio synthesis and playback
- **Sample Management**: Local WAV file loading with fallback to synthesized sounds
- **Sound Selection**: User-configurable sound options for each drum type
- **Mute System**: Individual and global mute controls with visual feedback

### User Interface

- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
- **Theme System**: Dark/light mode with system preference detection
- **Visual Indicators**: 4-step beat markers and current position highlighting
- **Accessibility**: Keyboard shortcuts and focus management

## 🔧 Development Setup

### Prerequisites

- Modern web browser with Web Audio API support
- Basic knowledge of JavaScript, CSS, and HTML
- Git for version control

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd drum-machine
   ```

2. **Start development server**

   ```bash
   npx serve . -p 3000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Open browser developer tools for debugging

### File Structure

```
drum-machine/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling with themes
├── script.js           # Core drum machine logic
├── samples.js          # Sample loading and management
├── README.md           # User documentation
├── DEVELOPMENT.md      # This development guide
└── .gitignore         # Git ignore rules
```

## 🎵 Audio Implementation

### Web Audio API Usage

#### Audio Context

```javascript
// Initialize audio context
this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Resume context on user interaction
document.addEventListener(
  'click',
  () => {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  },
  { once: true }
);
```

#### Sample Loading

```javascript
// Load external sample with fallback
const audioBuffer = await loadSample(this.audioContext, drumType);
if (audioBuffer) {
  this.samples[drumType] = audioBuffer;
} else {
  // Fallback to synthesized sound
  this.samples[drumType] = this.createSynthesizedSound(drumType);
}
```

#### Sound Playback

```javascript
playSound(drumType) {
    if (!this.samples[drumType]) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = this.samples[drumType];
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Add natural variation
    gainNode.gain.value = 0.7 + Math.random() * 0.3;

    source.start();
}
```

### Synthesized Sound Generation

#### Kick Drum Example

```javascript
case 'kick':
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
```

## 🎨 Theme System Implementation

### CSS Custom Properties

#### Light Theme Variables

```css
:root {
  --bg-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-secondary: rgba(255, 255, 255, 0.95);
  --text-primary: #333;
  --text-secondary: #555;
  --accent-color: #ffc107;
  --primary-color: #667eea;
}
```

#### Dark Theme Variables

```css
[data-theme='dark'] {
  --bg-primary: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  --bg-secondary: rgba(255, 255, 255, 0.05);
  --text-primary: #fff;
  --text-secondary: #ccc;
  --accent-color: #ffd700;
  --primary-color: #2196f3;
}
```

### JavaScript Theme Management

#### Theme Toggle

```javascript
toggleTheme() {
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('drumMachineTheme', newTheme);

        // Update button icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.title = `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
        }
    } catch (error) {
        console.error('Failed to toggle theme:', error);
    }
}
```

## 📱 Responsive Design

### CSS Grid Layout

```css
.controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
}

@media (max-width: 768px) {
  .controls {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}
```

### Flexbox for Drum Machine

```css
.drum-machine {
  display: flex;
  gap: 20px;
}

@media (max-width: 768px) {
  .drum-machine {
    flex-direction: column;
    gap: 15px;
  }
}
```

## 🔄 State Management

### Pattern Data Structure

```javascript
this.sequencer = {
    kick: [false, false, true, false, false, false, true, false, ...],
    snare: [false, false, false, false, true, false, false, false, ...],
    hihat: [true, false, true, false, true, false, true, false, ...],
    // ... other drum types
};
```

### Beat Data for Sharing

```javascript
const beatData = {
  sequencer: this.sequencer,
  tempo: this.tempo,
  patternLength: this.patternLength
};

const encoded = btoa(JSON.stringify(beatData));
const url = `${window.location.origin}${window.location.pathname}?beat=${encoded}`;
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Theme switching works correctly
- [ ] Audio samples load and play
- [ ] Grid interaction responds properly
- [ ] URL sharing generates valid links
- [ ] Local storage saves and loads beats
- [ ] Responsive design works on mobile
- [ ] Keyboard shortcuts function properly

### Browser Testing

- **Chrome**: 66+ (Primary development target)
- **Firefox**: 60+ (Web Audio API support)
- **Safari**: 11+ (Mobile testing)
- **Edge**: 79+ (Windows compatibility)

### Performance Testing

- **Load Time**: Under 3 seconds on 3G
- **Audio Latency**: Under 50ms from click to sound
- **Memory Usage**: Monitor for memory leaks
- **Frame Rate**: Maintain 60fps during playback

## 🚀 Deployment

### Static Site Hosting

- **GitHub Pages**: Automatic deployment from main branch
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **Any static hosting**: Upload files to any web server

### Build Process

Currently no build process required - pure static files.

### Optimization

- **Minification**: Consider minifying CSS/JS for production
- **Compression**: Enable gzip compression on server
- **Caching**: Set appropriate cache headers
- **CDN**: Use CDN for faster global access

## 🐛 Debugging

### Common Issues

#### Audio Context Suspended

```javascript
// Check audio context state
console.log('Audio context state:', this.audioContext.state);

// Resume if suspended
if (this.audioContext.state === 'suspended') {
  await this.audioContext.resume();
}
```

#### Sample Loading Failures

```javascript
// Check sample loading status
console.log('Sample loading status:', {
  kick: !!this.samples.kick,
  snare: !!this.samples.snare
  // ... other samples
});
```

#### Theme Not Persisting

```javascript
// Check localStorage
console.log('Saved theme:', localStorage.getItem('drumMachineTheme'));
console.log(
  'Current theme:',
  document.documentElement.getAttribute('data-theme')
);
```

### Console Logging

The application includes comprehensive console logging for debugging:

- Audio context initialization
- Sample loading status
- Theme switching
- Error handling

## 📚 Code Style

### JavaScript

- Use ES6+ features (const, let, arrow functions, async/await)
- Follow consistent naming conventions
- Include error handling for all async operations
- Add console logging for debugging

### CSS

- Use CSS custom properties for theming
- Follow BEM-like naming conventions
- Include responsive design considerations
- Maintain accessibility standards

### HTML

- Semantic HTML structure
- Proper ARIA labels where needed
- Clean, readable markup
- Consistent indentation

## 🔮 Potential Future Development

### Planned Features

- **Pattern Library**: Built-in beat templates
- **Advanced Effects**: Reverb, delay, compression
- **MIDI Export**: Export patterns as MIDI files

### Technical Improvements

- **WebAssembly**: Audio processing in WebAssembly
- **Service Worker**: Offline-first experience
- **PWA Support**: Install as desktop/mobile app

### Contribution Areas

- **UI/UX Improvements**: Better visual design and interactions
- **Audio Quality**: Enhanced sound synthesis and effects
- **Performance**: Optimization and memory management
- **Accessibility**: Better keyboard navigation and screen reader support
- **Mobile Experience**: Touch gestures and mobile-specific features

## 📞 Getting Help

### Resources

- **Web Audio API Documentation**: MDN Web Docs
- **CSS Grid/Flexbox**: CSS-Tricks guides
- **JavaScript ES6+**: Modern JavaScript tutorials
- **Audio Synthesis**: Web Audio API examples

### Community

- **GitHub Issues**: Report bugs and request features
- **Pull Requests**: Submit code improvements
- **Discussions**: Join project discussions

---

**Happy Coding! 🎵💻**
