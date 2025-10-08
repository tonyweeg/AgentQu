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
        // Ocean-inspired adventure palette
        'ocean-deep': '#0A4D68',      // Deep ocean blue
        'ocean-mid': '#088395',       // Medium ocean blue
        'ocean-bright': '#05BFDB',    // Vibrant turquoise
        'coral': '#F16767',           // Coral accent
        'sand': '#FFB84C',            // Sandy/sunset accent
        'seafoam': '#E8F6F3',         // Light seafoam background
        'navy-text': '#1A2238',       // Dark navy text

        // Legacy colors (for gradual migration)
        cream: '#F5EDE4',
        peach: '#D4906B',
        'dark-text': '#2D2D2D',
      },
    },
  },
  plugins: [],
}
