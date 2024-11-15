import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "rgba(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "rgba(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        text: {
          primary: "hsl(var(--primary-text))",
          secondary: "hsl(var(--secondary-text))",
          tertiary: "hsl(var(--tertiary-text))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        glow: {
          blue: "hsl(var(--glow-blue))",
          purple: "hsl(var(--glow-purple))",
          pink: "hsl(var(--glow-pink))",
          amber: "hsl(var(--glow-amber))",
        },
        status: {
          success: "hsl(var(--success-glow))",
          warning: "hsl(var(--warning-glow))",
          error: "hsl(var(--error-glow))",
          info: "hsl(var(--info-glow))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "radial-gradient(circle 150px at top, hsla(0, 0%, 100%, 0.4), transparent 90%)",
        "glass-border":
          "linear-gradient(180deg, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0.05))",
        "glow-radial":
          "radial-gradient(hsla(0, 100%, 88%, 0.7) 20%, transparent)",
        "glow-gradient": "var(--glow-gradient)",
      },
      backdropBlur: {
        glass: "36px",
      },
      boxShadow: {
        glass: "0 4px 40px 8px rgba(0, 0, 0, 0.4)",
        glow: "0 0 50px hsla(0, 100%, 88%, 0.7)",
      },
      animation: {
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
