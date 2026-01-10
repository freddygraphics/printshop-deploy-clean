/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0051A8",
          light: "#0A63C4",
          dark: "#003B7A",
        },
        background: "#F5F7F9",
        card: "#FFFFFF",
        border: "#E5E8EB",
        text: {
          DEFAULT: "#1E293B",
          muted: "#6B7280",
        },
      },
      borderRadius: {
        soft: "10px",
        xl: "14px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.07)",
        soft: "0 1px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
