/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f5f7fb",
        text: "#1f2937",
        border: "#e5e7eb",

        primary: "#6366f1",
        "primary-light": "#818cf8",
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.06)",
        soft: "0 2px 6px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
