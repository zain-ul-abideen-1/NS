export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: { extend: {
    fontFamily: {
      display: ['Syne', 'sans-serif'],
      sans: ['DM Sans', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    colors: {
      brand: {
        blue:  '#1078c2',
        green: '#59d12a',
        dark:  '#0d65ad',
      }
    }
  }},
  plugins: []
}