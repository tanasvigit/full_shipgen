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
import { useState } from "react";
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
    { id: "iam", label: "IAM", to: "/iam/users", icon: ShieldCheck, prefix: "/iam" },
];

export default function Header({ onOpenPalette }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, organizations, activeOrganization, switchOrganization, logout: performLogout } = useAuth();
    const [switchingOrg, setSwitchingOrg] = useState(false);
    const currentOrg = activeOrganization || organizations[0] || { name: "No Organization" };

    const isActive = (engine) => {
        if (engine.id === "console") return location.pathname === "/" || location.pathname === "/notifications";
        return engine.prefix ? location.pathname.startsWith(engine.prefix) : false;
    };

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
        <header className="sticky top-0 z-40 glass-header" data-testid="console-header">
            <div className="flex items-center h-[60px] px-5 gap-5">
                <Link to="/" className="flex items-center gap-3 pr-5 mr-1 border-r border-black/[0.06] h-full" data-testid="header-logo">
                    <img
                        src="/logo_logistic.png"
                        alt="Shipgen"
                        className="h-8 w-auto object-contain"
                    />
                    <div className="hidden sm:flex flex-col leading-none">
                        <span className="font-mono text-[9px] tracking-[0.25em] text-[#4B5563] uppercase mt-0.5">Command Center</span>
                    </div>
                </Link>

                <nav className="flex items-center gap-0.5" data-testid="smart-nav">
                    {engines.map((e) => {
                        const Icon = e.icon;
                        const active = isActive(e);
                        return (
                            <Link
                                key={e.id}
                                to={e.to}
                                data-testid={`nav-${e.id}`}
                                data-active={active ? "true" : "false"}
                                className="engine-pill"
                            >
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span className="hidden md:inline">{e.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={onOpenPalette}
                    data-testid="command-palette-trigger"
                    className="ml-auto hidden md:flex items-center gap-2.5 h-9 px-3.5 bg-[#F5F6F8] hover:bg-[#EEF0F4] border border-black/[0.06] hover:border-black/[0.12] rounded-lg text-xs text-[#374151] hover:text-[#0A0E1A] transition-all min-w-[280px] group"
                >
                    <Search className="h-3.5 w-3.5 group-hover:text-[#0066FF] transition-colors" strokeWidth={1.75} />
                    <span className="font-mono tracking-tight">Search orders, drivers, vehicles…</span>
                    <kbd className="ml-auto font-mono text-[10px] bg-white border border-black/[0.08] text-[#374151] px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>

                <div className="md:ml-0 ml-auto flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button data-testid="org-switcher" className="flex items-center gap-2 h-9 px-3 hover:bg-black/[0.04] rounded-lg border border-transparent hover:border-black/[0.08] transition-all">
                                <Building2 className="h-3.5 w-3.5 text-[#374151]" strokeWidth={1.75} />
                                <span className="text-[12.5px] font-medium hidden lg:inline max-w-[120px] truncate text-[#0A0E1A]">{currentOrg.name}</span>
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
                            <button data-testid="user-menu-trigger" className="flex items-center gap-2 h-9 pl-1 pr-2 hover:bg-black/[0.04] rounded-lg border border-transparent hover:border-black/[0.08] transition-all">
                                <div className={`h-7 w-7 ${user?.avatarColor || "bg-blue-600"} grid place-items-center rounded-md ring-1 ring-inset ring-white/20`}>
                                    <span className="text-[11px] font-bold font-mono">{user?.avatarInitials || "U"}</span>
                                </div>
                                <ChevronDown className="h-3 w-3 text-[#4B5563]" strokeWidth={2} />
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
