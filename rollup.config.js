import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-import-css';

export default defineConfig({
  input: 'src/main.js',
  output: {
    file: 'dist/script.js',
    format: 'iife',
    name: 'DrumMachine',
    sourcemap: true
  },
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    css({
      output: 'dist/styles.css'
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: {
        toplevel: true
        // Keep function names for debugging
        // reserved: ['DrumMachine', 'AudioManager', 'BeatStorage', 'PianoManager']
      }
    })
  ],
  external: [],
  onwarn(warning, warn) {
    // Skip certain warnings
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;

    // Use default for everything else
    warn(warning);
  }
});
