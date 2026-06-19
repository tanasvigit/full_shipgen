import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CalendarClock, ShieldCheck, ListOrdered, Map, Warehouse,
  Truck, PackageCheck, Receipt, Wrench, HardHat, Sparkles, BarChart3,
  Activity, Settings, LogOut, AlertTriangle,
} from "lucide-react";
import { COMPANY } from "../../data/db";

const NAV = [
  { section: "Control", items: [
    { to: "/", label: "Control Tower", icon: LayoutDashboard, testId: "nav-dashboard" },
    { to: "/queue", label: "Virtual Queue", icon: ListOrdered, testId: "nav-queue" },
    { to: "/yard", label: "Yard Map", icon: Map, testId: "nav-yard" },
    { to: "/ai", label: "Recommendations", icon: Sparkles, testId: "nav-ai" },
  ]},
  { section: "Operations", items: [
    { to: "/appointments", label: "Appointments", icon: CalendarClock, testId: "nav-appointments" },
    { to: "/gate", label: "Gate Management", icon: ShieldCheck, testId: "nav-gate" },
    { to: "/docks", label: "Docks", icon: Warehouse, testId: "nav-docks" },
    { to: "/loading", label: "Loading Ops", icon: PackageCheck, testId: "nav-loading" },
  ]},
  { section: "Resources", items: [
    { to: "/vehicles", label: "Vehicles", icon: Truck, testId: "nav-vehicles" },
    { to: "/equipment", label: "Equipment", icon: Wrench, testId: "nav-equipment" },
    { to: "/labor", label: "Labor", icon: HardHat, testId: "nav-labor" },
  ]},
  { section: "Finance & Reports", items: [
    { to: "/operations-dashboard", label: "Operations Dashboard", icon: LayoutDashboard, testId: "nav-operations-dashboard" },
    { to: "/reports/delay-analysis", label: "Delay Analysis", icon: AlertTriangle, testId: "nav-delay-analysis" },
    { to: "/detention", label: "Detention Management", icon: Receipt, testId: "nav-detention" },
    { to: "/kpis", label: "Executive KPIs", icon: BarChart3, testId: "nav-kpis" },
  ]},
];

export const Sidebar = () => {
  return (
    <aside data-testid="sidebar" className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-100 min-h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-amber-400 flex items-center justify-center">
            <Activity className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-bold text-base leading-none tracking-tight">YARD<span className="text-amber-400">.OS</span></div>
            <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Vehicle Orchestration</div>
          </div>
        </div>
      </div>

      {/* Facility */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="text-[10px] uppercase tracking-widest text-slate-500">Facility</div>
        <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{COMPANY.facility}</div>
        <div className="font-mono-yms text-[10px] text-slate-400 mt-0.5">{COMPANY.facilityCode}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto thin-scroll">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">{group.section}</div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  data-testid={item.testId}
                  className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-amber-400 text-slate-900"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-slate-800 transition cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-100">
            {COMPANY.operator.split(" ").map((p) => p[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-100 truncate">{COMPANY.operator}</div>
            <div className="text-[10px] text-slate-400 truncate">{COMPANY.operatorRole}</div>
          </div>
          <Settings className="w-4 h-4 text-slate-400" />
        </div>
        <button data-testid="logout-btn" className="w-full mt-1.5 flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
