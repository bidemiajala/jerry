/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#4ade80',
          cyan: '#38bdf8',
          orange: '#fb923c',
          purple: '#c084fc',
        },
        terminal: {
          bg: '#0d1117',
          surface: '#161b22',
          border: '#21262d',
          muted: '#30363d',
          dim: '#8b949e',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'neon-green':  '0 0 0 1px rgba(74,222,128,0.15)',
        'neon-cyan':   '0 0 0 1px rgba(56,189,248,0.15)',
        'neon-orange': '0 0 0 1px rgba(251,146,60,0.15)',
        'neon-purple': '0 0 0 1px rgba(192,132,252,0.15)',
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
