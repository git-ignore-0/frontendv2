import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        paper: "var(--paper)",
        forest: "var(--forest)",
        moss: "var(--moss)",
        soil: "var(--soil)",
        terra: "var(--terra)",
        straw: "var(--straw)",
        ink: "var(--ink)",
        muted: "var(--muted)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
      },
      maxWidth: {
        site: "80rem",
        prose: "72ch",
      },
      boxShadow: {
        soft: "var(--shadow)",
      },
      transitionTimingFunction: {
        natural: "var(--ease)",
      },
    },
  },
  plugins: [],
} satisfies Config;
