import { Search, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';
import { PARKING_EMBEDDED } from '../../constants/basePath';

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** @deprecated Use dashboard layout context. */
  onToggleSidebar?: () => void;
}

function EmbeddedHeader({ title, subtitle }: HeaderProps) {
  return (
    <div className="relative border-b border-black/[0.06] bg-[#F5F6F8] overflow-hidden" data-testid="page-header">
      <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#0066FF]/[0.06] blur-[80px] pointer-events-none" />
      <div className="relative px-7 py-7">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1 w-6 rounded-full bg-gradient-to-r from-[#0066FF] to-transparent" />
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4B5563]">Parking</span>
        </div>
        <h1 className="font-display text-[34px] sm:text-[40px] font-black tracking-[-0.045em] leading-[1.02] text-[#0A0E1A]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[14px] text-[#374151] mt-2.5 max-w-2xl leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function StandaloneHeader({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const { sidebarOpen, onToggleSidebar } = useDashboardLayout();
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U';

  return (
    <header className="flex items-center justify-between px-6 lg:px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-40" data-testid="page-header">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          data-testid="header-menu-button"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 min-w-[220px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle or ticket"
            className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none w-full"
            data-testid="header-search-input"
          />
        </div>
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500"
          data-testid="header-notifications-button"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#ea1c26] flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:ring-2 hover:ring-[#ea1c26]/30 ring-offset-2">
          {initials}
        </div>
      </div>
    </header>
  );
}

export default function Header(props: HeaderProps) {
  if (PARKING_EMBEDDED) {
    return <EmbeddedHeader {...props} />;
  }
  return <StandaloneHeader {...props} />;
}
