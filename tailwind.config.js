export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(262, 80%, 55%)",
          50: "hsl(262, 80%, 95%)",
          100: "hsl(262, 80%, 90%)",
          200: "hsl(262, 80%, 80%)",
          300: "hsl(262, 80%, 70%)",
          400: "hsl(262, 80%, 60%)",
          500: "hsl(262, 80%, 55%)",
          600: "hsl(262, 80%, 45%)",
          700: "hsl(262, 80%, 35%)",
          800: "hsl(262, 80%, 25%)",
          900: "hsl(262, 80%, 15%)"
        },
        accent: {
          DEFAULT: "hsl(160, 70%, 45%)"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
