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
        // Rich ocean-inspired adventure palette
        'ocean-deep': '#003D5B',      // Deep navy blue (darker, richer)
        'ocean-mid': '#00798C',       // Teal ocean blue
        'ocean-bright': '#30B1BB',    // Rich turquoise
        'ocean-accent': '#1F7A8C',    // Medium teal accent
        'coral': '#E76F51',           // Warm coral (less orange)
        'sand': '#F4A261',            // Muted sand (reduced orange)
        'seafoam': '#D8EAF0',         // Soft blue-grey background
        'navy-text': '#0D1B2A',       // Deep navy text

        // Legacy colors (for gradual migration)
        cream: '#F5EDE4',
        peach: '#D4906B',
        'dark-text': '#2D2D2D',
      },
    },
  },
  plugins: [],
}
