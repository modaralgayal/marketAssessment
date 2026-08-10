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
        // Teal palette for the marketing / landing site
        brand: {
          teal: "#0F7B7F",
          "teal-dark": "#0A5D64",
          ink: "#101828",
          muted: "#5B6472",
          line: "#E5E7EB",
          "bg-alt": "#F9FAFB",
          orange: "#E8734A",
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
