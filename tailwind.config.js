/** @type {import('tailwindcss').Config} */
export default {
  // hover: をホバーできる端末に限定する（タップ後にホバー色が残らないようにする）
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}

