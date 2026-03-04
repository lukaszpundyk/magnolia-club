/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs'],
  theme: {
    extend: {
      colors: {
        'mc-bg': '#F7F9FB',
        'mc-bg2': '#ECF0F5',
        'mc-dark': '#FFFFFF',
        'mc-accent': '#6E8BA0',
        'mc-light': '#1E2A36',
        'mc-muted': '#8A95A3',
        'mc-highlight': '#516F88',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
