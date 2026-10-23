const color = (name, opacity = '1') => ({ opacityValue = '1' }) => `rgb(var(--${name}-rgb) / calc(${opacityValue} * ${opacity}))`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './{components,context,hooks,services,utils,config}/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: color('bg'),
        foreground: color('text'),
        primary: { DEFAULT: color('primary'), foreground: '#ffffff' },
        muted: { DEFAULT: color('hover', 'var(--hover-opacity)'), foreground: color('muted') },
        destructive: '#dc2626',
        web3: {
          bg: color('bg'),
          card: color('card', 'var(--card-opacity)'),
          cardHover: color('hover', 'var(--hover-opacity)'),
          border: color('border', 'var(--border-opacity)'),
          text: color('text'),
          textMuted: color('muted'),
          primary: color('primary'),
          secondary: color('secondary'),
          accent: color('accent'),
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
