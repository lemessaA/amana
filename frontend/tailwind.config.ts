import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-primary-bg)",
        foreground: "var(--color-primary-text)",
        card: "var(--color-card-bg)",
        "sidebar-bg": "var(--color-sidebar-bg)",
        "elevated-surface": "var(--color-elevated-surface)",
        "primary-accent": "var(--color-primary-accent)",
        "secondary-accent": "var(--color-secondary-accent)",
        secondary: "var(--color-secondary-text)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        muted: "var(--color-secondary-text)",
        border: "var(--color-border)",
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      spacing: {
        gutter: "1.5rem",
        "gutter-lg": "2rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
    },
  },
  plugins: [],
};

export default config;
