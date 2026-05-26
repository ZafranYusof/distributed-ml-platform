/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#2d1b69',
          800: '#1E1045',
          900: '#1A0533',
          950: '#0D0221',
        },
        accent: {
          blue: '#3B82F6',
          green: '#10B981',
          'green-light': '#34D399',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
        },
        neural: {
          primary: '#6366F1',
          secondary: '#7C3AED',
          glow: '#a78bfa',
        }
      },
      backgroundImage: {
        'gradient-neural': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        'gradient-sidebar': 'linear-gradient(180deg, #1A0533, #0D0221)',
        'gradient-header': 'linear-gradient(90deg, #4F46E5, #7C3AED, #3B82F6)',
        'gradient-btn': 'linear-gradient(135deg, #6366F1, #7C3AED)',
        'gradient-login': 'linear-gradient(135deg, #0D0221 0%, #1A0533 30%, #2d1b69 60%, #4F46E5 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 15px rgba(124, 58, 237, 0.25)',
        'glow-purple-lg': '0 0 30px rgba(124, 58, 237, 0.35)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.25)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
};
