import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
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
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        premium: {
          DEFAULT: "hsl(var(--premium))",
          foreground: "hsl(var(--premium-foreground))",
          variant: "hsl(var(--premium-variant))",
        },
        // Card-specific colors for different user types and content
        "student-card": {
          DEFAULT: "hsl(var(--student-card-primary))",
          light: "hsl(var(--student-card-light))",
          border: "hsl(var(--student-card-border))",
          text: "hsl(var(--student-card-text))",
          secondary: "hsl(var(--student-card-secondary))",
        },
        "teacher-card": {
          DEFAULT: "hsl(var(--teacher-card-primary))",
          light: "hsl(var(--teacher-card-light))",
          border: "hsl(var(--teacher-card-border))",
          text: "hsl(var(--teacher-card-text))",
        },
        "course-card": {
          DEFAULT: "hsl(var(--course-card-primary))",
          light: "hsl(var(--course-card-light))",
          border: "hsl(var(--course-card-border))",
          text: "hsl(var(--course-card-text))",
        },
        "achievement-card": {
          DEFAULT: "hsl(var(--achievement-card-primary))",
          light: "hsl(var(--achievement-card-light))",
          border: "hsl(var(--achievement-card-border))",
          text: "hsl(var(--achievement-card-text))",
        },
        "admin-card": {
          DEFAULT: "hsl(var(--admin-card-primary))",
          light: "hsl(var(--admin-card-light))",
          border: "hsl(var(--admin-card-border))",
          text: "hsl(var(--admin-card-text))",
        },
        "community-card": {
          DEFAULT: "hsl(var(--community-card-primary))",
          light: "hsl(var(--community-card-light))",
          border: "hsl(var(--community-card-border))",
          text: "hsl(var(--community-card-text))",
        },
        purple: {
          50: "#eef2fe",
          100: "#dde5fd",
          200: "#c2d4fc",
          300: "#9cb8f9",
          400: "#7495f5",
          500: "#4e72ee",
          600: "#2d5ddd",
          700: "#2347c5",
          800: "#1f3ba0",
          900: "#1e357f",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-shimmer": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-shimmer": "slide-shimmer 2s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-premium': 'var(--gradient-premium)',
        'gradient-card': 'var(--gradient-card)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
        'premium': 'var(--shadow-premium)',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
