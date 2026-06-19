import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "../ui/sheet";
import { useAuth } from "../../contexts/AuthContext";
import { NAV_MENU, filterNavMenu } from "../../constants/navigation";
import { ROLE_LABELS } from "../../services/authStorage";
import { TOUCH_BTN } from "../../lib/responsiveClasses";

/**
 * Hamburger navigation for viewports below lg (1024px).
 * Role-filtered menu closes automatically after route selection.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { can, displayName, username, role } = useAuth();
  const location = useLocation();

  const menu = useMemo(() => filterNavMenu(NAV_MENU, can), [can]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          data-testid="mobile-nav-toggle"
          aria-label="Open navigation menu"
          className={`lg:hidden ${TOUCH_BTN} rounded-md hover:bg-slate-800 text-slate-100`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-[min(100vw,320px)] p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-slate-200 bg-slate-900 text-white text-left">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-white font-display text-base">
              YARD<span className="text-amber-400">.OS</span>
            </SheetTitle>
            <SheetClose asChild>
              <button type="button" aria-label="Close menu" className={TOUCH_BTN}>
                <X className="w-5 h-5" />
              </button>
            </SheetClose>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {displayName || username} · {ROLE_LABELS[role] || role}
          </p>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto thin-scroll py-2" data-testid="mobile-nav-menu">
          {menu.map((section) => (
            <div key={section.section} className="mb-3">
              <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                {section.section}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SheetClose asChild>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        data-testid={item.testId}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 text-sm min-h-[44px] ${
                            isActive
                              ? "bg-amber-50 text-slate-900 border-r-2 border-amber-400 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </SheetClose>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

      </SheetContent>
    </Sheet>
  );
}
