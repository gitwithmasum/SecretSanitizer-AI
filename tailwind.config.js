/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./dashboard.html",
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#06090F',
          900: '#0B0F19',
          850: '#101624',
          800: '#161F33',
          700: '#232E4A',
          600: '#324063'
        },
        cyan: {
          glow: '#00F2FE',
          DEFAULT: '#06B6D4'
        },
        purple: {
          glow: '#A855F7',
          DEFAULT: '#8B5CF6'
        },
        shield: {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 20px -3px rgba(139, 92, 246, 0.35)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'cyber': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
