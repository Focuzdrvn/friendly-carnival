/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-dark': '#0f0f23',
        'space-blue': '#667eea',
        'space-purple': '#764ba2',
        'space-gray': '#1a1a2e',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'space-dark-gradient': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      }
    },
  },
  plugins: [],
}
