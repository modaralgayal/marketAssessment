import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette from the original form design
        "dark-blue": "#1B3A5C",
        "mid-blue": "#2E6DA4",
        "light-blue": "#D6E4F0",
        "pale-blue": "#EBF4FA",
        orange: "#E8A020",
        border: "#E0E6ED",
        "light-gray": "#F7F8FA",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
