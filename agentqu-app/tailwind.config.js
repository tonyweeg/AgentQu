/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#F5EDE4',
        peach: '#D4906B',
        'dark-text': '#2D2D2D',
      },
    },
  },
  plugins: [],
}
