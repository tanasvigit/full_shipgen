import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Settings, LogOut, AlertTriangle, Bell, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import BrandLogo from "../common/BrandLogo";
import { useAuth } from "../../contexts/AuthContext";
import controlTowerAlertsApi from "../../services/controlTowerAlertsApi";
import { NAV_MENU, filterNavMenu, firstAccessiblePath } from "../../constants/navigation";
import { MOD } from "../../constants/permissions";
import { yardPath } from "../../constants/basePath";
import { ROLE_LABELS } from "../../services/authStorage";
import MobileNav from "./MobileNav";
import { TOUCH_BTN } from "../../lib/responsiveClasses";
import useAppHeaderHeight from "../../hooks/useAppHeaderHeight";

const useClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const SectionTrigger = ({ section, icon: Icon, items, isActive, currentLabel }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        data-testid={`menu-${section.toLowerCase()}`}
        className={`inline-flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-md text-[11px] xl:text-[12px] font-semibold whitespace-nowrap transition border ${
          isActive
            ? "bg-amber-400 text-slate-900 border-amber-400"
            : "text-slate-200 hover:bg-slate-800 hover:text-white border-transparent"
        }`}
      >
        <Icon className="hidden xl:block w-3.5 h-3.5" strokeWidth={2} />
        <span>{section}</span>
        {isActive && currentLabel && (
          <span className="hidden 2xl:inline font-mono-yms text-[10px] opacity-80 ml-0.5">· {currentLabel}</span>
        )}
        <ChevronDown className="hidden xl:block w-3 h-3 opacity-70" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" sideOffset={8} className="w-64 rounded-md p-1.5 z-[9999]">
      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 pb-2 pt-1">
        {section}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {items.map((item) => (
        <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-sm">
          <NavLink
            to={item.to}
            end={item.end}
            data-testid={item.testId}
            className={({ isActive: a }) =>
              `flex items-start gap-2.5 px-2 py-2 text-[12.5px] w-full ${a ? "bg-slate-100" : ""}`
            }
          >
            <div className="w-7 h-7 shrink-0 rounded-md bg-slate-100 flex items-center justify-center mt-0.5">
              <item.icon className="w-3.5 h-3.5 text-slate-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{item.label}</div>
              <div className="text-[10.5px] text-slate-500 leading-tight">{item.desc}</div>
            </div>
          </NavLink>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const TopNav = () => {
  const { role, displayName, username, can, logout, impersonating } = useAuth();
  const now = useClock();
  const location = useLocation();
  const navigate = useNavigate();
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0, total: 0 });

  const menu = useMemo(() => filterNavMenu(NAV_MENU, can), [can]);

  const loadAlerts = useCallback(async () => {
    if (!can(MOD.CONTROL_TOWER)) return;
    try {
      const data = await controlTowerAlertsApi.fetchControlTowerAlerts();
      setAlertCounts({
        critical: data.criticalCount ?? 0,
        warning: data.warningCount ?? 0,
        total: (data.activeAlerts || []).length,
      });
    } catch {
      setAlertCounts({ critical: 0, warning: 0, total: 0 });
    }
  }, [can]);

  useEffect(() => {
    loadAlerts();
    const onChange = () => loadAlerts();
    window.addEventListener("yms-data-changed", onChange);
    const t = setInterval(loadAlerts, 30000);
    return () => {
      window.removeEventListener("yms-data-changed", onChange);
      clearInterval(t);
    };
  }, [loadAlerts]);

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });

  const activeMatch = menu
    .flatMap((s) => s.items.map((it) => ({ ...it, section: s.section })))
    .find((it) => (it.to === "/" ? location.pathname === "/" : location.pathname.startsWith(it.to)));

  const initials = (displayName || username || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  const handleBrandHome = useCallback(() => {
    navigate(firstAccessiblePath(can));
  }, [can, navigate]);

  const headerRef = useAppHeaderHeight(activeMatch?.to ?? "none");

  return (
    <header
      ref={headerRef}
      data-testid="topnav"
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900 text-slate-100 border-b border-slate-800"
    >
      <div className="flex items-center justify-between gap-2 lg:gap-4 px-3 sm:px-5 h-14 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <button
            onClick={handleBrandHome}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition"
            data-testid="brand-home"
            aria-label="YARD.OS — Smart Yard Management System"
          >
            <BrandLogo variant="icon" height={32} className="shrink-0" />
            <div className="hidden 2xl:block leading-tight text-left min-w-0">
              <div className="font-display font-bold text-xs tracking-tight whitespace-nowrap">
                YARD<span className="text-amber-400">.OS</span>
              </div>
              <div className="text-[9px] text-slate-400 tracking-wide whitespace-nowrap">
                Smart Yard Management System
              </div>
            </div>
          </button>
          <MobileNav />
        </div>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-1.5 min-w-0 px-2">
          {menu.map((s) => (
            <SectionTrigger
              key={s.section}
              section={s.section}
              icon={s.icon}
              items={s.items}
              isActive={activeMatch?.section === s.section}
              currentLabel={activeMatch?.section === s.section ? activeMatch.label : null}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0 min-w-0">
          <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-slate-800/70">
            <div className="text-right leading-tight">
              <div className="font-mono-yms text-[13px] font-semibold">{timeStr}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-widest">{dateStr} IST</div>
            </div>
          </div>

          <button
            data-testid="topnav-alert"
            title={`${alertCounts.total} active alerts`}
            onClick={handleBrandHome}
            className={`relative rounded-md hover:bg-slate-800 transition ${TOUCH_BTN}`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {alertCounts.critical > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {alertCounts.critical}
              </span>
            )}
          </button>
          <button
            data-testid="topnav-notif"
            onClick={handleBrandHome}
            className={`relative rounded-md hover:bg-slate-800 transition ${TOUCH_BTN}`}
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {alertCounts.warning > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                {alertCounts.warning}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button data-testid="topnav-user" className={`flex items-center gap-2 pl-2 pr-1 rounded-md hover:bg-slate-800 transition min-h-[44px] ${TOUCH_BTN}`}>
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-100">
                  {initials}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-[11px] font-semibold">{displayName || username}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest">
                    {ROLE_LABELS[role] || role}
                    {impersonating ? " · impersonating" : ""}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-md z-[9999]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-500">
                Account
              </DropdownMenuLabel>
              {can("module.settings") && (
                <DropdownMenuItem
                  className="text-[12.5px] cursor-pointer"
                  onClick={() => navigate(yardPath("/settings"))}
                >
                  <Settings className="w-3.5 h-3.5 mr-2" /> Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="logout-btn"
                className="text-[12.5px] cursor-pointer text-red-600 focus:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {activeMatch && (
        <div className="bg-slate-950/40 border-t border-slate-800/60 px-3 sm:px-5 py-1.5 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold min-w-0 overflow-hidden">
          <span className="text-slate-500 shrink-0">{activeMatch.section}</span>
          <ChevronDown className="w-2.5 h-2.5 text-slate-600 -rotate-90 shrink-0" />
          <span className="text-amber-400 truncate">{activeMatch.label}</span>
          <span className="text-slate-600 shrink-0 hidden sm:inline">·</span>
          <span className="text-slate-400 normal-case tracking-normal truncate hidden sm:inline">{activeMatch.desc}</span>
        </div>
      )}
    </header>
  );
};

export default TopNav;
