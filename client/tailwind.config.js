/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0c1210",
          900: "#121a17",
          800: "#1a2621",
          700: "#24332c",
        },
        moss: {
          400: "#6f9b7a",
          500: "#4f7d5c",
          600: "#3d6549",
          700: "#2f4f39",
        },
        oak: {
          200: "#e8d5b5",
          300: "#d4b896",
          400: "#c19a6b",
          500: "#a67c52",
        },
        ivory: "#f3efe6",
      },
      fontFamily: {
        display: ['"Libre Baskerville"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        board: "0 24px 60px rgba(0,0,0,0.45)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(111,155,122,0.45)" },
          "70%": { boxShadow: "0 0 0 10px rgba(111,155,122,0)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        orbit: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        rise: "rise .6s ease both",
        pop: "pop .28s ease both",
        "pulse-ring": "pulseRing 1.6s ease-out infinite",
        floaty: "floaty 4.5s ease-in-out infinite",
        orbit: "orbit 1.1s linear infinite",
      },
      backgroundImage: {
        grain:
          "radial-gradient(ellipse at top, rgba(111,155,122,0.18), transparent 55%), radial-gradient(ellipse at bottom right, rgba(193,154,107,0.12), transparent 45%)",
      },
    },
  },
  plugins: [],
};
