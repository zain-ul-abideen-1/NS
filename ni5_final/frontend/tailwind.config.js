export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: { extend: {
    fontFamily: {
      // display/headings — Poppins in light, Syne in dark
      display: ['Poppins', 'Syne', 'sans-serif'],
      // body text — Poppins in light, DM Sans in dark
      sans:    ['Poppins', 'DM Sans', 'sans-serif'],
      mono:    ['JetBrains Mono', 'monospace'],
      // keep syne available as explicit class
      syne:    ['Syne', 'sans-serif'],
      poppins: ['Poppins', 'sans-serif'],
    },
    colors: {
      brand: {
        blue:   '#1078c2',
        green:  '#59d12a',
        dark:   '#0a5a99',
        light:  '#e8f3fc',
      }
    },
    boxShadow: {
      'brand-sm': '0 4px 14px rgba(16,120,194,0.28)',
      'brand-md': '0 6px 20px rgba(16,120,194,0.35)',
      'brand-lg': '0 10px 32px rgba(16,120,194,0.4)',
    }
  }},
  plugins: []
}