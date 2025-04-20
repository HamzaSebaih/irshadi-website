/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing colors
        primary: {
          light: '#66D771',  // Lighter shade Green
          DEFAULT: '#43CA52', // Main primary color Green
          dark: '#329A3E'   // Darker shade Green
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

        // Added colors for semantic states
        danger: { // Red palette for errors, destructive actions
          light: '#FEE2E2', // Suggests Tailwind's red-100
          DEFAULT: '#EF4444', // Suggests Tailwind's red-500
          dark: '#B91C1C'  // Suggests Tailwind's red-700
        },
        warning: { // Amber/Orange palette for warnings, attention needed
          light: '#FEF3C7', // Suggests Tailwind's amber-100
          DEFAULT: '#F59E0B', // Suggests Tailwind's amber-500
          dark: '#B45309'  // Suggests Tailwind's amber-700
        }
      }
    }
  },
  plugins: [],
}