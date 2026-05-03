import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
