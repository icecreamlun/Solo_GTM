/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        accent: {
          DEFAULT: "#22d3ee",
          soft: "#0891b2",
        },
      },
      keyframes: {
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0.6)" },
          "50%": { boxShadow: "0 0 0 8px rgba(34, 211, 238, 0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
