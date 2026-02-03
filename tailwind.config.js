/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'aiesec-blue': '#037EF3',
        'aiesec-orange': '#F85A40',
        'aiesec-teal': '#0CB9C1',
      }
    }
  },
  plugins: []
}
