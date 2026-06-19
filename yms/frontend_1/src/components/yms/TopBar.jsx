import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Search, X } from "lucide-react";
import { useUI } from "../../contexts/UIContext";
import JumpToResults from "./JumpToResults";
import { TOUCH_BTN } from "../../lib/responsiveClasses";
import { YARD_EMBEDDED } from "../../constants/basePath";

export const TopBar = ({ title, subtitle, actions }) => {
  const { search, setSearch, clearSearch } = useUI();
  const barRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty("--yms-topbar-height", `${el.offsetHeight}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobileSearchOpen, search, subtitle, title]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        clearSearch();
        inputRef.current?.blur();
      }
      if (e.key === "Escape" && document.activeElement === mobileInputRef.current) {
        clearSearch();
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSearch]);

  const searchField = (ref, testId) => (
    <>
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        ref={ref}
        data-testid={testId}
        placeholder="Search plate, transporter, dock…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        className="bg-transparent outline-none text-[12px] flex-1 min-w-0 placeholder:text-slate-400"
      />
      {search ? (
        <button
          data-testid="topbar-search-clear"
          onClick={clearSearch}
          className={`text-slate-400 hover:text-slate-700 ${TOUCH_BTN}`}
          aria-label="Clear"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <kbd className="hidden sm:inline font-mono-yms text-[10px] text-slate-400 border border-slate-300 rounded-sm px-1">⌘K</kbd>
      )}
      <JumpToResults
        open={focused && search.length > 0}
        query={search}
        inputRef={ref}
        onClose={() => setFocused(false)}
      />
    </>
  );

  return (
    <div
      ref={barRef}
      data-testid="topbar"
      className="bg-white border-b border-slate-200 sticky z-40 shadow-sm shrink-0"
      style={{ top: YARD_EMBEDDED ? 0 : "var(--yms-app-header-height, 3.5rem)" }}
    >
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 data-testid="page-title" className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate max-w-full">{title}</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Live</span>
            </span>
            {search && (
              <span data-testid="filter-indicator" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider max-w-full truncate">
                <Search className="w-3 h-3 shrink-0" /> Filtering: &ldquo;{search}&rdquo;
                <button
                  data-testid="clear-filter-btn"
                  onClick={clearSearch}
                  className={`ml-1 hover:bg-amber-200 rounded-sm ${TOUCH_BTN}`}
                  aria-label="Clear filter"
                  type="button"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
          {subtitle && <p className="text-[12px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>

        <button
          type="button"
          data-testid="topbar-mobile-search-toggle"
          onClick={() => {
            setMobileSearchOpen((o) => !o);
            if (!mobileSearchOpen) setTimeout(() => mobileInputRef.current?.focus(), 50);
          }}
          className={`md:hidden border border-slate-200 rounded-md bg-slate-50 text-slate-600 ${TOUCH_BTN}`}
          aria-label="Toggle search"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className={`hidden md:flex relative items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-md min-w-[200px] lg:min-w-[320px] transition ${search ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200"}`}>
          {searchField(inputRef, "topbar-search")}
        </div>

        {actions || null}
      </div>

      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className={`flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-md ${search ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200"}`}>
            {searchField(mobileInputRef, "topbar-search-mobile")}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
