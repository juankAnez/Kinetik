/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.ts", "./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F3F0FF",
          100: "#E9DFFF",
          200: "#D4BFFF",
          300: "#B894FF",
          400: "#9B6AFF",
          500: "#7C3AED",
          600: "#6C4CF1",
          700: "#5B3FD9",
          800: "#4A33B8",
          900: "#3A2896",
        },
        surface: "#FFFFFF",
        background: "#F8FAFC",
        foreground: "#0F172A",
        muted: "#64748B",
        border: "#E2E8F0",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl2: "16px",
        xl3: "20px",
        xl4: "24px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
        elevated: "0 4px 16px rgba(0, 0, 0, 0.08)",
        modal: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
}
