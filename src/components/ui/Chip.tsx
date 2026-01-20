import React from "react";

type Tone = "default" | "danger" | "warning" | "success" | "info";

export function Chip(props: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const tone = props.tone ?? "default";
  const cls =
    tone === "danger"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
        : tone === "success"
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
          : tone === "info"
            ? "border-sky-400/25 bg-sky-500/10 text-sky-200"
            : "border-white/10 bg-white/5 text-slate-200";

  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold " + cls + " " + (props.className ?? "")}>
      {props.children}
    </span>
  );
}
