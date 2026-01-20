import React from "react";

type Variant = "contained" | "outlined" | "text";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: Variant;
};

export function Button({ children, onClick, disabled, className, variant = "contained" }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "contained"
      ? "bg-sky-400/20 text-sky-100 hover:bg-sky-400/30 border border-sky-300/20"
      : variant === "outlined"
        ? "bg-transparent text-slate-100 hover:bg-white/5 border border-white/12"
        : "bg-transparent text-slate-100 hover:bg-white/5 border border-transparent";

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className ?? ""}`}>
      {children}
    </button>
  );
}
