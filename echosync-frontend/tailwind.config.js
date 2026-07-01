/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#E11D48',
        dark: '#0f172a',
        darker: '#020617',
      }
    },
  },
  plugins: [],
}
