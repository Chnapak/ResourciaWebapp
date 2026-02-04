/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/flowbite/**/*.js"],
  theme: {
    colors: {
        white: "#fcfbf4",
        light: "#FCFBF4"
      },
    extend: {
    },
  },
  plugins: [ require('flowbite/plugin') ],
}