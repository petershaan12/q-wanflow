/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        qwenlight: {
          "primary": "#756fdc",
          "primary-content": "#ffffff",
          "secondary": "#8b5cf6",
          "secondary-content": "#ffffff",
          "accent": "#06b6d4",
          "accent-content": "#ffffff",
          "neutral": "#1e1b4b",
          "neutral-content": "#e0e0ff",
          "base-100": "#ffffff",
          "base-200": "#f4f4f8",
          "base-300": "#e5e5ed",
          "base-content": "#1e1b4b",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      {
        qwendark: {
          "primary": "#756fdc",
          "primary-content": "#e2e1f0",
          "secondary": "#a78bfa",
          "secondary-content": "#e2e1f0",
          "accent": "#22d3ee",
          "accent-content": "#e2e1f0",
          "neutral": "#1e1b4b",
          "neutral-content": "#c7c7e8",
          "base-100": "#1c1c1c",
          "base-200": "#0f0f0f",
          "base-300": "#2a2a2a",
          "base-content": "#e2e1f0",
          "info": "#60a5fa",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
    ],
    darkTheme: "qwendark",
  },
}