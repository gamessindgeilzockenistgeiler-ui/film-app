import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#08090c',
          surface: '#111318',
          surface2: '#181b22',
          border: '#242832',
          accent: '#e50914',
          accent2: '#f5c518',
          gold: '#f5c518',
          text: '#e8e9ec',
          muted: '#8a8f9c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(229, 9, 20, 0.35)',
        card: '0 10px 30px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'cinema-gradient':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(229,9,20,0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(245,197,24,0.08), transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-700px 0' }, '100%': { backgroundPosition: '700px 0' } },
      },
    },
  },
  plugins: [],
};

export default config;
