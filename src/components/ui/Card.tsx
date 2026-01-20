import React from "react";

export function Card(props: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-2xl border border-white/10 bg-white/5 shadow-soft " + (props.className ?? "")}> 
      {props.title ? <div className="px-4 pt-4 text-sm font-semibold text-slate-100">{props.title}</div> : null}
      <div className={props.title ? "p-4 pt-3" : "p-4"}>{props.children}</div>
    </div>
  );
}
