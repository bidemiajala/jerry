/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          green:  'rgb(var(--neon-green)  / <alpha-value>)',
          cyan:   'rgb(var(--neon-cyan)   / <alpha-value>)',
          orange: 'rgb(var(--neon-orange) / <alpha-value>)',
          purple: 'rgb(var(--neon-purple) / <alpha-value>)',
        },
        terminal: {
          bg:      'rgb(var(--terminal-bg)      / <alpha-value>)',
          surface: 'rgb(var(--terminal-surface) / <alpha-value>)',
          border:  'rgb(var(--terminal-border)  / <alpha-value>)',
          muted:   'rgb(var(--terminal-muted)   / <alpha-value>)',
          dim:     'rgb(var(--terminal-dim)     / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'neon-green':  'var(--shadow-neon-green)',
        'neon-cyan':   'var(--shadow-neon-cyan)',
        'neon-orange': 'var(--shadow-neon-orange)',
        'neon-purple': 'var(--shadow-neon-purple)',
        'terminal':    '0 1px 3px rgba(0,0,0,0.4)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'terminal-cursor': 'blink 1s step-end infinite',
        'progress-fill': 'progressFill 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--target-width)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

module.exports = config
