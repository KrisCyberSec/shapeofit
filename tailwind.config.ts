import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        ink2: "var(--ink2)",
        ink3: "var(--ink3)",
        rule: "var(--rule)",
        rule2: "var(--rule2)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        teal: "var(--teal)",
        navy: "var(--navy)",
        gold: "var(--gold)"
      },
      fontFamily: {
        display: ["Instrument Serif", "Georgia", "serif"],
        mono: ["DM Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Outfit", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      animation: {
        "fade-up": "fadeUp .5s cubic-bezier(.22,1,.36,1) both",
        pulseDot: "pulseDot 1.4s ease-in-out infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseDot: {
          "0%, 100%": { opacity: ".35", transform: "scale(.86)" },
          "50%": { opacity: "1", transform: "scale(1)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
