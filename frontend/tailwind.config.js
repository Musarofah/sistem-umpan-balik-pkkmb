/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary:  { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8' },
        positif:  { DEFAULT: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
        netral:   { DEFAULT: '#D97706', light: '#FEF3C7', dark: '#B45309' },
        negatif:  { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#B91C1C' },
        surface:  '#F8FAFC',
        border:   '#E2E8F0',
      }
    }
  },
  plugins: []
}
