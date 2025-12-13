/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'isc-gold': '#F2A900',
        'isc-navy': '#13294B',
        'isc-orange': '#E84A27',
      },
      fontFamily: {
        'display': ['Montserrat', 'sans-serif'],
        'body': ['Source Sans Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
