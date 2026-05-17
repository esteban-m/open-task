/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f0f10',
          1: '#161618',
          2: '#1c1c1f',
          3: '#242427',
          4: '#2e2e32',
        },
        border: {
          DEFAULT: '#2e2e32',
          subtle: '#242427',
        },
        text: {
          DEFAULT: '#f0eff2',
          muted: '#9898a6',
          faint: '#5a5a6a',
        },
        accent: {
          DEFAULT: '#7c6af7',
          hover: '#9183f9',
          subtle: '#7c6af71a',
          '200': '#c4b5fd',
          '300': '#a78bfa',
          '400': '#8b5cf6',
          '500': '#7c6af7',
          '600': '#6d58f5',
          '700': '#5b4ac9',
          '800': '#483cb0',
          '900': '#342e88',
        },
        danger: {
          DEFAULT: '#f05d6e',
          subtle: '#f05d6e1a',
        },
        success: {
          DEFAULT: '#4caf82',
          subtle: '#4caf821a',
        },
        warning: {
          DEFAULT: '#f0a050',
          subtle: '#f0a0501a',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '14px',
      },
    },
  },
  plugins: [],
}
