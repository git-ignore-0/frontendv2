import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: "var(--forest)",
        "forest-deep": "var(--forest-deep)",
        leaf: "var(--leaf)",
        young: "var(--young-leaf)",
        soil: "var(--soil)",
        terra: "var(--terracotta)",
        rice: "var(--rice-paper)",
        warm: "var(--warm-white)",
        charcoal: "var(--charcoal)",
        straw: "var(--straw)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      maxWidth: {
        site: "80rem",
        prose: "72ch",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
      },
      transitionTimingFunction: {
        natural: "var(--ease-natural)",
      },
    },
  },
  plugins: [],
} satisfies Config;
