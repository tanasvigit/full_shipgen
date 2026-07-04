import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavForRole } from '../../config/navigation';
import { parkingAuthPath, parkingPath } from '../../constants/basePath';
import SystemStatus from './SystemStatus';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ParkingCircle,
  BarChart3,
  Cpu,
  QrCode,
  ClipboardList,
  Settings,
  Ticket,
  CreditCard,
  Printer,
  Search,
  Clock,
  CircleDot,
  LogOut,
  Activity,
  Layers,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { UserRole } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={18} />,
  'Employee Management': <Users size={18} />,
  Pricing: <DollarSign size={18} />,
  'Parking Management': <ParkingCircle size={18} />,
  'Parking Monitoring': <ParkingCircle size={18} />,
  Reports: <BarChart3 size={18} />,
  Hardware: <Cpu size={18} />,
  'QR Monitoring': <QrCode size={18} />,
  'Audit Logs': <ClipboardList size={18} />,
  Settings: <Settings size={18} />,
  'New Ticket': <Ticket size={18} />,
  'Collect Payment': <CreditCard size={18} />,
  'QR Ticket Print': <Printer size={18} />,
  'Vehicle Search': <Search size={18} />,
  'Exit Vehicle': <LogOut size={18} />,
  'Recent Tickets': <Clock size={18} />,
  'Operator Activity': <Activity size={18} />,
  'Floor Management': <Layers size={18} />,
  'Occupancy Summary': <Layers size={18} />,
};

const ROLE_SUBTITLES: Record<UserRole, string> = {
  admin: 'Parking Management',
  supervisor: 'Supervisor Panel',
  operator: 'Operator Panel',
};

const labelTransition =
  'whitespace-nowrap overflow-hidden transition-[max-width,opacity,margin] duration-300 ease-in-out';

interface SidebarProps {
  role: UserRole;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const nav = getNavForRole(role);
  const desktopCollapsed = collapsed;

  const handleLogout = () => {
    void logout().finally(() => {
      navigate(parkingAuthPath());
    });
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <aside
      className={`h-full bg-sidebar-dark flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
        desktopCollapsed ? 'w-16' : 'w-60'
      } max-lg:w-60`}
      data-testid={`sidebar-${role}`}
      data-collapsed={desktopCollapsed ? 'true' : 'false'}
    >
      <div className={`shrink-0 pt-5 pb-2 transition-[padding] duration-300 ease-in-out ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
        <div className="relative h-[3.25rem] overflow-hidden">
          <div
            className={`absolute inset-0 flex items-center gap-2 transition-opacity duration-300 ease-in-out ${
              desktopCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            } max-lg:opacity-100 max-lg:pointer-events-auto`}
          >
            <img
              src="/security-systems-1.svg"
              alt=""
              className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 ease-in-out"
              width={36}
              height={36}
            />
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-white font-bold text-lg tracking-tight leading-tight truncate">
                Security Systems
              </h1>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{ROLE_SUBTITLES[role]}</p>
            </div>
          </div>

          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
              desktopCollapsed ? 'opacity-100' : 'pointer-events-none opacity-0'
            } max-lg:opacity-0 max-lg:pointer-events-none`}
          >
            <img
              src="/security-systems-1.svg"
              alt="Security Systems"
              className="h-8 w-8 object-contain transition-transform duration-300 ease-in-out"
              width={32}
              height={32}
              title="Security Systems"
            />
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex mt-3 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all duration-300 ease-in-out"
            aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="sidebar-collapse-toggle"
          >
            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <ChevronsLeft
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  desktopCollapsed ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
                aria-hidden={desktopCollapsed}
              />
              <ChevronsRight
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  desktopCollapsed ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                }`}
                aria-hidden={!desktopCollapsed}
              />
            </span>
          </button>
        )}
      </div>

      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 mt-2 transition-[padding] duration-300 ease-in-out ${
          desktopCollapsed ? 'px-2' : 'px-3'
        }`}
      >
        {nav.map((item) => (
          <NavLink
            key={item.path}
            to={parkingPath(item.path)}
            onClick={handleNavClick}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                desktopCollapsed ? 'justify-center px-0 py-2.5 max-lg:justify-start max-lg:px-3 max-lg:gap-3' : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-sidebar-active text-white shadow-lg shadow-[#ea1c26]/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
            data-testid={`nav-link-${item.path.replaceAll('/', '-').replace(/^-/, '')}`}
          >
            <span className="shrink-0 flex items-center justify-center w-[18px]">{iconMap[item.label] || <CircleDot size={18} />}</span>
            <span
              className={`${labelTransition} max-lg:max-w-[12rem] max-lg:opacity-100 ${
                desktopCollapsed ? 'max-w-0 opacity-0' : 'max-w-[12rem] opacity-100'
              }`}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div
        className={`shrink-0 pb-5 transition-[padding] duration-300 ease-in-out ${desktopCollapsed ? 'px-2' : 'px-3'}`}
      >
        {role === 'admin' && <SystemStatus collapsed={desktopCollapsed} />}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 ${
            desktopCollapsed
              ? 'justify-center px-0 py-2.5 max-lg:justify-start max-lg:px-3 max-lg:gap-3'
              : 'gap-3 px-3 py-2.5'
          }`}
          data-testid="logout-button"
        >
          <span className="shrink-0 flex items-center justify-center w-[18px]">
            <LogOut size={18} />
          </span>
          <span
            className={`${labelTransition} max-lg:max-w-[8rem] max-lg:opacity-100 ${
              desktopCollapsed ? 'max-w-0 opacity-0' : 'max-w-[8rem] opacity-100'
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
