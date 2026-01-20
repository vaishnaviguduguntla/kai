import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  rightSlot?: React.ReactNode;
};

export function Input({ className, rightSlot, ...rest }: Props) {
  return (
    <div className={"flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:ring-2 focus-within:ring-sky-400/30 " + (className ?? "")}>
      <input
        {...rest}
        className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 outline-none"
      />
      {rightSlot}
    </div>
  );
}
