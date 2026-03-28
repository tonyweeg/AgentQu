/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // PoliScai brand colors
        'poliscai': {
          'primary': '#1e3a5f',      // Deep navy - authority, trust
          'secondary': '#c9a227',    // Gold - importance, heritage
          'accent': '#8b0000',       // Deep red - constitutional gravity
          'light': '#f5f5f5',        // Off-white - parchment feel
          'dark': '#1a1a2e',         // Near black - text
        },
        // Status colors for highlights
        'shadow': {
          'approved': '#dc2626',     // Red - approved shadow note
          'pending': '#f59e0b',      // Amber - pending flag
          'compliant': '#16a34a',    // Green - V2.0 compliant
          'revised': '#2563eb',      // Blue - new V2.0 language
        },
        // Verdict colors
        'verdict': {
          'constitutional': '#16a34a',
          'partial': '#f59e0b',
          'unconstitutional': '#dc2626',
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
