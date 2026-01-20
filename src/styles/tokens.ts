export const tokens = {
  color: {
    bg: "#0b1220",
    surface: "#0f1b2d",
    surface2: "#0c1626",
    border: "rgba(255,255,255,0.08)",
    text: "#e6eefc",
    muted: "rgba(230,238,252,0.72)",

    primary: "#6ea8fe",
    secondary: "#b69cff",
    danger: "#ff6b6b",
    warning: "#ffd166",
    success: "#2dd4bf"
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px"
  },
  shadow: {
    sm: "0 2px 10px rgba(0,0,0,0.25)",
    md: "0 8px 24px rgba(0,0,0,0.35)"
  },
  ring: {
    focus: "0 0 0 3px rgba(110,168,254,0.35)"
  }
} as const;
