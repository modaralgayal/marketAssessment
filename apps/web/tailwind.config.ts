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
        // Lake & Birch palette for the marketing / landing site.
        // Values come from CSS variables (see src/index.css) so opacity
        // modifiers (bg-brand-teal/10) keep working.
        brand: {
          teal: "rgb(var(--brand-teal) / <alpha-value>)",
          "teal-dark": "rgb(var(--brand-teal-dark) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          muted: "rgb(var(--brand-muted) / <alpha-value>)",
          line: "rgb(var(--brand-line) / <alpha-value>)",
          "bg-alt": "rgb(var(--brand-bg-alt) / <alpha-value>)",
          orange: "rgb(var(--brand-orange) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        display: ["Hanken Grotesk", "Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
