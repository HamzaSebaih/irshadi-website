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
          light: '#3B82F6',  // blue-500
          DEFAULT: '#1D4ED8', // blue-700
          dark: '#1E40AF'   // blue-800
        },
        secondary: {
          light: '#B0E6EB', // Lighter shade Cyan/Light Blue
          DEFAULT: '#96DCE2', // Main secondary color Cyan/Light Blue
          dark: '#70C2CA'  // Darker shade Cyan/Light Blue
        },
        accent: {
          light: '#86BCE0', // Lighter shade Blue
          DEFAULT: '#64A8D4', // Main accent color Blue
          dark: '#4D8FBF'  // Darker shade Blue
        },

        danger: { // Red palette for errors, destructive actions
          light: '#FEE2E2', // red-100
          DEFAULT: '#EF4444', // red-500
          dark: '#B91C1C'  // red-700
        },
        warning: { 
          light: '#FEF3C7', // amber-100
          DEFAULT: '#F59E0B', // amber-500
          dark: '#B45309'  // amber-700
        }
      }
    }
  },
  plugins: [],
}