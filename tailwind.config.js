/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#66D771',  // Lighter shade
          DEFAULT: '#43CA52', // Main primary color
          dark: '#329A3E'     // Darker shade
        },
        secondary: {
          light: '#B0E6EB',
          DEFAULT: '#96DCE2',
          dark: '#70C2CA'
        },
        accent: {
          light: '#86BCE0',
          DEFAULT: '#64A8D4',
          dark: '#4D8FBF'
        }
      }
    }
  },
  plugins: [],
}
