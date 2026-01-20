import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FilterBar } from "@/components/FilterBar";

export default function AppShell() {
  return (
    <div className="min-h-full text-slate-100">
      <Navbar />
      <FilterBar />
      <main className="min-h-[calc(100vh-140px)]">
        <Outlet />
      </main>
    </div>
  );
}
