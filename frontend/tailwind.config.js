/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12181B",
          800: "#171F23",
          700: "#1E272D",
          600: "#2B373F",
          500: "#3D4D57",
        },
        signal: {
          DEFAULT: "#12181B",
          soft: "#2B373F",
          50: "#EBF1F3",
          accent: "#00C9E8",
        },
        paper: {
          DEFAULT: "#DCE5E7",
          light: "#EAF0F2",
          card: "#FFFFFF",
          glass: "rgba(255, 255, 255, 0.85)",
        },
        mute: {
          DEFAULT: "#647582",
          light: "#95A5B0",
          dark: "#4B5A65",
        },
        accent: {
          cyan: "#00D2EE",
          teal: "#0284C7",
          glow: "rgba(0, 210, 238, 0.35)",
        },
        good: "#10B981",
        warn: "#F59E0B",
        bad: "#EF4444",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(18, 24, 27, 0.05), 0 2px 8px -2px rgba(18, 24, 27, 0.03)",
        "card-hover": "0 20px 40px -12px rgba(18, 24, 27, 0.1), 0 6px 14px -3px rgba(18, 24, 27, 0.05)",
        pill: "0 4px 16px -2px rgba(18, 24, 27, 0.22)",
        orb: "0 0 60px 15px rgba(0, 210, 238, 0.35), inset 0 0 35px rgba(0, 210, 238, 0.5)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      keyframes: {
        scan: {
          "0%, 100%": { transform: "translateY(0%)" },
          "50%": { transform: "translateY(100%)" },
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.8, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
        floatOrb: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(3deg)" },
        },
      },
      animation: {
        scan: "scan 3.2s ease-in-out infinite",
        rise: "rise 0.4s ease-out both",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        floatOrb: "floatOrb 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
