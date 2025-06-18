/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // App.js의 categoryStyles에 있는 모든 클래스를 safelist에 추가합니다.
  safelist: [
    'text-purple-600', 'bg-purple-100', 'bg-purple-500',
    'text-green-600', 'bg-green-100', 'bg-green-500',
    'text-orange-600', 'bg-orange-100', 'bg-orange-500',
    'text-blue-600', 'bg-blue-100', 'bg-blue-500',
    'text-red-600', 'bg-red-100', 'bg-red-500',
    'text-gray-600', 'bg-gray-100', 'bg-gray-500'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}