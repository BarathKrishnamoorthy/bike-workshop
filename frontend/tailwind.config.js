/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
          sidebar: '#581c87',
          sidebarHover: '#6b21a8',
          sidebarActive: '#7e22ce',
          primary: '#7c3aed',
          primaryHover: '#6d28d9',
          lightBg: '#f5f3ff',
          lightAccent: '#ede9fe',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(124, 58, 237, 0.06), 0 4px 16px -2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(124, 58, 237, 0.12), 0 6px 16px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
