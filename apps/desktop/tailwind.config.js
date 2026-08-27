/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#FF5E3A",
          2: "#FF8A65",
        },
        sky: "#38BDF8",
        violet: "#C084FC",
        pink: "#FF9A9E",
        amber: "#FFD166",
        teal: "#326578",
        lime: "#556500",
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#55555A",
          faint: "#8B8B90",
        },
        canvas: "#FBF9F6",
      },
      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.45)",
        "glass-strong": "rgba(255, 255, 255, 0.7)",
      },
      borderColor: {
        glass: "rgba(255, 255, 255, 0.7)",
        line: "rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "28px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.06)",
        toast: "0 20px 40px -15px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
