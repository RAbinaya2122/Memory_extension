/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0A',
          card: '#111111',
          hover: '#161616',
          border: '#27272A',
          subtle: '#3F3F46',
        },
        purple: {
          primary: '#8B5CF6',
          glow: '#A78BFA',
          dark: '#6D28D9',
        },
        indigo: {
          secondary: '#6366F1',
          glow: '#818CF8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -5px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 30px -5px rgba(139, 92, 246, 0.5)',
      }
    },
  },
  plugins: [],
}
