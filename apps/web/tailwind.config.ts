import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: {
          DEFAULT: "#faf9f5",
          elev: "#ffffff",
          sunk: "#f3f1ea",
        },
        ink: {
          DEFAULT: "#0f1f1c",
          soft: "#3d4f4a",
          mute: "#7a8a83",
          line: "#dcdfd6",
        },
        forest: {
          50: "#eff5ee",
          100: "#dceadb",
          200: "#b8d4b7",
          300: "#8cb98c",
          400: "#5a9b5e",
          500: "#2f8042",
          600: "#1f6432",
          700: "#175027",
          800: "#0f3e1d",
          900: "#082813",
        },
        ember: {
          50: "#fbeee9",
          400: "#e07a55",
          500: "#c0392b",
          600: "#9b2b1f",
        },
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      borderRadius: {
        sharp: "2px",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(15, 31, 28, 0.04)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "rise-in": "rise-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 1000ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
