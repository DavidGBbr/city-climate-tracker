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
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Page surfaces — soft warm whites & airy off-whites
        bg: {
          DEFAULT: "#f7f9f5",
          elev: "#ffffff",
          sunk: "#eef2ea",
        },
        // Text & lines — soft slate, never pure black
        ink: {
          DEFAULT: "#0e1f17",
          soft: "#395048",
          mute: "#7a8a83",
          line: "#dbe5d8",
        },
        // Primary — vibrant emerald (OpenEarth-style)
        emerald: {
          50: "#e8f8ef",
          100: "#ccf0d9",
          200: "#9fe2b8",
          300: "#65ce92",
          400: "#2ecc71",
          500: "#10b981",
          600: "#0c9c6b",
          700: "#0a7d57",
          800: "#0a6346",
          900: "#0a4d37",
        },
        // Soft sky for secondary accents
        sky: {
          50: "#eaf4fb",
          100: "#d0e7f4",
          400: "#6db4dc",
        },
        // Warning / off-pace
        ember: {
          50: "#fdeee6",
          400: "#f08654",
          500: "#dc6841",
          600: "#b85533",
        },
      },
      letterSpacing: {
        eyebrow: "0.12em",
      },
      borderRadius: {
        DEFAULT: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(14, 31, 23, 0.04), 0 8px 24px -12px rgba(14, 31, 23, 0.08)",
        glow: "0 0 0 1px rgba(16, 185, 129, 0.16), 0 12px 32px -8px rgba(16, 185, 129, 0.2)",
      },
      backgroundImage: {
        // Soft topographic pattern reminiscent of OpenEarth's organic textures
        topo: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><g fill='none' stroke='%2310b981' stroke-opacity='0.06' stroke-width='1'><path d='M-100 200 Q150 100 300 250 T700 200'/><path d='M-100 280 Q150 180 300 330 T700 280'/><path d='M-100 360 Q150 260 300 410 T700 360'/><path d='M-100 440 Q150 340 300 490 T700 440'/></g></svg>\")",
        "radial-leaf":
          "radial-gradient(ellipse at top left, rgba(16,185,129,0.12), transparent 60%)",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(-8deg)" },
          "50%": { transform: "translateY(-8px) rotate(-4deg)" },
        },
      },
      animation: {
        "rise-in": "rise-in 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
