import { NavLink } from "react-router-dom";
import { ROUTES } from "@/consts/routes";

const linkBase = "px-3 py-2 rounded-xl text-sm font-semibold transition";

export default function Navbar() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0b1220]">
      <div className="text-slate-100 font-bold">Security Vulnerability Dashboard</div>
      <div className="flex items-center gap-2">
        <NavLink
          to={ROUTES.DASHBOARD}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-white/10 text-slate-50" : "text-slate-200 hover:bg-white/5"}`
          }
          end
        >
          Dashboard
        </NavLink>
        <NavLink
          to={ROUTES.VULNERABILITIES}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-white/10 text-slate-50" : "text-slate-200 hover:bg-white/5"}`
          }
        >
          Vulnerabilities
        </NavLink>
        <NavLink
          to={ROUTES.COMPARE}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "bg-white/10 text-slate-50" : "text-slate-200 hover:bg-white/5"}`
          }
        >
          Compare
        </NavLink>
      </div>
    </div>
  );
}
