import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Search,
    ChevronDown,
    Truck,
    ShieldCheck,
    Settings as SettingsIcon,
    Command as CommandIcon,
    LogOut,
    User,
    LayoutGrid,
    Building2,
    Check,
    ShoppingBag,
    Receipt,
    Code2,
    Boxes,
    Blocks,
} from "lucide-react";
import { useMemo, useState } from "react";
import { IAM_HEADER_SHORTCUTS } from "@/lib/iam/headerShortcuts";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotificationsTray from "@/components/console/NotificationsTray";
import { useAuth } from "@/contexts/AuthContext";

const engines = [
    { id: "console", label: "Console", to: "/", icon: LayoutGrid },
    { id: "fleet-ops", label: "FleetOps", to: "/fleet-ops/operations/orders", icon: Truck, prefix: "/fleet-ops" },
    { id: "storefront", label: "Storefront", to: "/storefront", icon: ShoppingBag, prefix: "/storefront" },
    { id: "ledger", label: "Ledger", to: "/ledger", icon: Receipt, prefix: "/ledger" },
    { id: "pallet", label: "Pallet", to: "/pallet", icon: Boxes, prefix: "/pallet" },
    { id: "developers", label: "Developers", to: "/developers", icon: Code2, prefix: "/developers" },
    { id: "registry", label: "Registry", to: "/registry", icon: Blocks, prefix: "/registry" },
    { id: "iam", label: "IAM", to: "/iam", icon: ShieldCheck, prefix: "/iam" },
];

export default function Header({ onOpenPalette }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, organizations, activeOrganization, switchOrganization, logout: performLogout, hasPermission } = useAuth();
    const [switchingOrg, setSwitchingOrg] = useState(false);
    const currentOrg = activeOrganization || organizations[0] || { name: "No Organization" };

    const isActive = (engine) => {
        if (engine.id === "console") return location.pathname === "/" || location.pathname === "/notifications";
        return engine.prefix ? location.pathname.startsWith(engine.prefix) : false;
    };

    const fleetOpsShortcuts = [];
    const showFleetShortcuts =
        location.pathname.startsWith("/fleet-ops") && fleetOpsShortcuts.length > 0;

    const iamHeaderShortcuts = useMemo(
        () => IAM_HEADER_SHORTCUTS.filter((item) => !item.permission || hasPermission(item.permission)),
        [hasPermission],
    );
    const showIamShortcuts =
        location.pathname.startsWith("/iam") && iamHeaderShortcuts.length > 0;

    async function logout() {
        await performLogout();
        navigate("/auth");
    }

    async function onSwitchOrg(org) {
        if (!org?.id || switchingOrg) return;
        setSwitchingOrg(true);
        try {
            await switchOrganization(org.id);
        } finally {
            setSwitchingOrg(false);
        }
    }

    return (
        <header className="sticky top-0 z-40 glass-header overflow-hidden" data-testid="console-header">
            <div className="flex h-14 min-w-0 max-w-full items-center gap-2 px-3 sm:px-4">
                <Link
                    to="/"
                    className="flex h-full shrink-0 items-center gap-2 border-r border-black/[0.06] pr-2 sm:pr-3"
                    data-testid="header-logo"
                >
                    <img src="/logo_logistic.png" alt="Shipgen" className="h-7 w-auto object-contain" />
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-[#4B5563] xl:inline">
                        Command Center
                    </span>
                </Link>

                <nav
                    className="engine-pill-nav flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
                    data-testid="smart-nav"
                >
                    {engines.map((e) => {
                        const Icon = e.icon;
                        const active = isActive(e);
                        return (
                            <Link
                                key={e.id}
                                to={e.to}
                                data-testid={`nav-${e.id}`}
                                data-active={active ? "true" : "false"}
                                className="engine-pill engine-pill--compact shrink-0"
                            >
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span className="hidden lg:inline">{e.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {showFleetShortcuts && (
                    <nav className="hidden xl:flex items-center gap-0.5 border-l border-black/[0.06] pl-3 shrink-0" data-testid="fleetops-header-shortcuts">
                        {fleetOpsShortcuts.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    data-testid={item.testId}
                                    className="px-2 h-8 text-[11px] font-medium text-[#374151] hover:text-[#0066FF] hover:bg-[#F5F6F8] rounded-md flex items-center gap-1"
                                >
                                    <Icon className="h-3 w-3" strokeWidth={1.75} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                {showIamShortcuts && (
                    <nav
                        className="hidden xl:flex items-center gap-0.5 border-l border-black/[0.06] pl-3 shrink-0 max-w-[min(52vw,640px)] overflow-x-auto"
                        data-testid="iam-header-shortcuts"
                    >
                        {iamHeaderShortcuts.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    data-testid={item.testId}
                                    data-active={active ? "true" : "false"}
                                    className={`px-2 h-8 text-[11px] font-medium rounded-md flex items-center gap-1 shrink-0 ${
                                        active
                                            ? "text-[#0066FF] bg-[#0066FF]/10"
                                            : "text-[#374151] hover:text-[#0066FF] hover:bg-[#F5F6F8]"
                                    }`}
                                >
                                    <Icon className="h-3 w-3" strokeWidth={1.75} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                <button
                    type="button"
                    onClick={onOpenPalette}
                    data-testid="command-palette-trigger"
                    title="Command palette (⌘K)"
                    className="group hidden shrink-0 items-center gap-1.5 rounded-md border border-black/[0.06] bg-[#F5F6F8] px-2 h-8 text-[#374151] transition-all hover:border-black/[0.12] hover:bg-[#EEF0F4] hover:text-[#0A0E1A] md:flex md:w-[140px] lg:w-[180px] xl:w-[200px]"
                >
                    <Search className="h-3.5 w-3.5 shrink-0 group-hover:text-[#0066FF]" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate text-left text-[11px] font-mono tracking-tight lg:text-xs hidden lg:inline">
                        Search…
                    </span>
                    <kbd className="hidden shrink-0 rounded border border-black/[0.08] bg-white px-1 py-0.5 font-mono text-[9px] text-[#374151] xl:inline">
                        ⌘K
                    </kbd>
                </button>

                <button
                    type="button"
                    onClick={onOpenPalette}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-black/[0.06] bg-[#F5F6F8] text-[#374151] hover:bg-[#EEF0F4] md:hidden"
                    aria-label="Open command palette"
                >
                    <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>

                <div className="flex shrink-0 items-center gap-0.5 border-l border-black/[0.06] pl-1 sm:pl-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button data-testid="org-switcher" className="flex max-w-[100px] items-center gap-1.5 h-8 px-2 hover:bg-black/[0.04] rounded-lg border border-transparent hover:border-black/[0.08] transition-all sm:max-w-[140px] lg:max-w-[160px] lg:px-2.5">
                                <Building2 className="h-3.5 w-3.5 shrink-0 text-[#374151]" strokeWidth={1.75} />
                                <span className="hidden truncate text-[12px] font-medium text-[#0A0E1A] sm:inline">{currentOrg.name}</span>
                                <ChevronDown className="h-3 w-3 text-[#4B5563]" strokeWidth={2} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-black/[0.08] w-72 p-1.5 rounded-xl">
                            <DropdownMenuLabel className="overline px-2 py-1.5">Organization</DropdownMenuLabel>
                            {organizations.map((o) => (
                                <DropdownMenuItem
                                    key={o.id}
                                    onClick={() => onSwitchOrg(o)}
                                    data-testid={`org-option-${o.id}`}
                                    className="flex items-start gap-2 cursor-pointer py-2.5 px-2.5 rounded-lg focus:bg-black/[0.05]"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[#0A0E1A]">{o.name}</div>
                                        <div className="text-[10px] text-[#4B5563] font-mono uppercase tracking-[0.22em] mt-0.5">{o.plan} · {o.role}</div>
                                    </div>
                                    {currentOrg.id === o.id && <Check className="h-4 w-4 text-cyan-accent mt-0.5" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <NotificationsTray />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button data-testid="user-menu-trigger" className="flex shrink-0 items-center gap-1 h-8 rounded-lg border border-transparent pl-0.5 pr-1.5 hover:border-black/[0.08] hover:bg-black/[0.04] transition-all">
                                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 ring-inset ring-white/20 ${user?.avatarColor || "bg-blue-600"}`}>
                                    <span className="text-[10px] font-bold font-mono">{user?.avatarInitials || "U"}</span>
                                </div>
                                <ChevronDown className="hidden h-3 w-3 shrink-0 text-[#4B5563] sm:block" strokeWidth={2} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-black/[0.08] w-60 p-1.5 rounded-xl">
                            <DropdownMenuLabel className="px-2 py-2">
                                <div className="text-sm font-medium text-[#0A0E1A]">{user?.name || "User"}</div>
                                <div className="text-[11px] text-[#374151] font-mono mt-0.5">{user?.email || ""}</div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-black/[0.06] my-1" />
                            <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer rounded-md focus:bg-black/[0.05]" data-testid="menu-account">
                                <User className="h-4 w-4 mr-2 text-[#374151]" /> Account
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer rounded-md focus:bg-black/[0.05]" data-testid="menu-settings">
                                <SettingsIcon className="h-4 w-4 mr-2 text-[#374151]" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onOpenPalette} className="cursor-pointer rounded-md focus:bg-black/[0.05]" data-testid="menu-command">
                                <CommandIcon className="h-4 w-4 mr-2 text-[#374151]" /> Command palette
                                <kbd className="ml-auto font-mono text-[9px] bg-[#F5F6F8]/80 border border-black/[0.08] text-[#374151] px-1 py-0.5 rounded">⌘K</kbd>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-black/[0.06] my-1" />
                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-[#FF1744] focus:text-[#FF1744] focus:bg-[#FF1744]/[0.08] rounded-md" data-testid="menu-logout">
                                <LogOut className="h-4 w-4 mr-2" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
