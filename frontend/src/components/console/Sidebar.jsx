import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Users,
    Car,
    MapPin,
    Building,
    UserCog,
    KeyRound,
    FileKey,
    UsersRound,
    Bell,
    Settings as SettingsIcon,
    User,
    ChevronRight,
    ShoppingBag,
    BookOpen,
    Tag,
    Megaphone,
    Network,
    Receipt,
    Wallet,
    ArrowLeftRight,
    LineChart,
    KeyRound as Keys,
    Webhook,
    Zap,
    Activity,
    Radio,
    HeartPulse,
    Rocket,
    Store,
    Contact,
    AlertCircle,
    Cpu,
    Wrench,
    ClipboardList,
    Boxes,
    Fuel,
    Warehouse,
    ArrowRightLeft,
    Factory,
    ScrollText,
    Route,
    CalendarClock,
    Blocks,
    BookText,
    NotebookPen,
    ShoppingCart,
    Shield,
    FileStack,
    PackageOpen,
    BadgeCheck,
    Hash,
    ListChecks,
} from "lucide-react";

const sections = {
    "/": [
        {
            label: "Console",
            items: [
                { to: "/", label: "Dashboard", icon: LayoutDashboard },
                { to: "/notifications", label: "Notifications", icon: Bell },
                { to: "/account", label: "Account", icon: User },
                { to: "/settings", label: "Settings", icon: SettingsIcon },
                { to: "/onboarding", label: "Onboarding", icon: Rocket },
                { to: "/admin/health", label: "Platform health", icon: HeartPulse },
            ],
        },
    ],
    "/fleet-ops": [
        {
            label: "Operations",
            items: [
                { to: "/fleet-ops/operations/orders", label: "Orders", icon: Package, badge: "12" },
                { to: "/fleet-ops/operations/routes", label: "Routes", icon: Route },
                { to: "/fleet-ops/operations/schedule", label: "Schedule", icon: CalendarClock },
                { to: "/fleet-ops/operations/order-config", label: "Order config", icon: SettingsIcon },
            ],
        },
        {
            label: "Management",
            items: [
                { to: "/fleet-ops/management/drivers", label: "Drivers", icon: Users },
                { to: "/fleet-ops/management/vehicles", label: "Vehicles", icon: Car },
                { to: "/fleet-ops/management/places", label: "Places", icon: MapPin },
                { to: "/fleet-ops/management/fleets", label: "Fleets", icon: Building },
                { to: "/fleet-ops/management/vendors", label: "Vendors", icon: Store },
                { to: "/fleet-ops/management/contacts", label: "Contacts", icon: Contact },
                { to: "/fleet-ops/management/issues", label: "Issues", icon: AlertCircle },
                { to: "/fleet-ops/management/fuel-reports", label: "Fuel reports", icon: Fuel },
            ],
        },
        {
            label: "Connectivity",
            items: [
                { to: "/fleet-ops/connectivity/telematics", label: "Telematics", icon: Radio },
                { to: "/fleet-ops/connectivity/sensors", label: "Sensors", icon: Activity },
                { to: "/fleet-ops/connectivity/tracking", label: "Fleet tracking", icon: MapPin },
            ],
        },
        {
            label: "Maintenance",
            items: [
                { to: "/fleet-ops/maintenance/schedules", label: "Schedules", icon: CalendarClock },
                { to: "/fleet-ops/maintenance/work-orders", label: "Work orders", icon: ClipboardList },
                { to: "/fleet-ops/maintenance/equipment", label: "Equipment", icon: Wrench },
                { to: "/fleet-ops/maintenance/parts", label: "Parts", icon: Boxes },
            ],
        },
        {
            label: "Resources",
            items: [
                { to: "/fleet-ops/admin/warranties", label: "Warranties", icon: Shield },
                { to: "/fleet-ops/admin/manifests", label: "Manifests", icon: FileStack },
                { to: "/fleet-ops/admin/payloads", label: "Payloads", icon: PackageOpen },
                { to: "/fleet-ops/admin/entities", label: "Entities", icon: Boxes },
                { to: "/fleet-ops/admin/proofs", label: "Proofs", icon: BadgeCheck },
                { to: "/fleet-ops/admin/purchase-rates", label: "Purchase rates", icon: Receipt },
                { to: "/fleet-ops/admin/tracking-numbers", label: "Tracking numbers", icon: Hash },
                { to: "/fleet-ops/admin/tracking-statuses", label: "Tracking statuses", icon: ListChecks },
            ],
        },
        {
            label: "Platform",
            items: [
                { to: "/fleet-ops/service-areas", label: "Service areas", icon: MapPin },
                { to: "/fleet-ops/settings", label: "Platform settings", icon: SettingsIcon },
                { to: "/fleet-ops/custom-fields", label: "Custom fields", icon: Blocks },
                { to: "/fleet-ops/tracking/lookup", label: "Track order", icon: Package },
            ],
        },
    ],
    "/storefront": [
        {
            label: "Catalog",
            items: [
                { to: "/storefront", label: "Overview", icon: LayoutDashboard },
                { to: "/storefront/products", label: "Products", icon: Package },
                { to: "/storefront/catalogs", label: "Catalogs", icon: BookOpen },
            ],
        },
        {
            label: "Audience",
            items: [
                { to: "/storefront/customers", label: "Customers", icon: Users },
                { to: "/storefront/networks", label: "Networks", icon: Network },
            ],
        },
        {
            label: "Sales",
            items: [
                { to: "/storefront/checkout", label: "Checkout Preview", icon: ShoppingCart },
            ],
        },
        {
            label: "Marketing",
            items: [
                { to: "/storefront/promotions", label: "Push Promotions", icon: Megaphone },
                { to: "/storefront/coupons", label: "Coupons", icon: Tag },
            ],
        },
    ],
    "/ledger": [
        {
            label: "Overview",
            items: [{ to: "/ledger", label: "Dashboard", icon: LayoutDashboard }],
        },
        {
            label: "Billing",
            items: [
                { to: "/ledger/billing/invoices", label: "Invoices", icon: Receipt, badge: "14" },
            ],
        },
        {
            label: "Payments",
            items: [
                { to: "/ledger/payments/transactions", label: "Transactions", icon: ArrowLeftRight },
                { to: "/ledger/payments/wallets", label: "Wallets", icon: Wallet },
            ],
        },
        {
            label: "Insights",
            items: [{ to: "/ledger/reports", label: "Reports", icon: LineChart }],
        },
        {
            label: "Accounting",
            items: [
                { to: "/ledger/accounting/chart-of-accounts", label: "Chart of Accounts", icon: BookText },
                { to: "/ledger/accounting/journal", label: "Journal Entries", icon: NotebookPen },
            ],
        },
    ],
    "/developers": [
        {
            label: "Overview",
            items: [{ to: "/developers", label: "Dashboard", icon: LayoutDashboard }],
        },
        {
            label: "Authentication",
            items: [{ to: "/developers/api-keys", label: "API Keys", icon: Keys }],
        },
        {
            label: "Integrations",
            items: [
                { to: "/developers/webhooks", label: "Webhooks", icon: Webhook },
                { to: "/developers/sockets", label: "Realtime Sockets", icon: Radio },
            ],
        },
        {
            label: "Inspect",
            items: [
                { to: "/developers/events", label: "Event Types", icon: Zap },
                { to: "/developers/logs", label: "Request Logs", icon: Activity },
            ],
        },
    ],
    "/pallet": [
        {
            label: "Overview",
            items: [{ to: "/pallet", label: "Dashboard", icon: LayoutDashboard }],
        },
        {
            label: "Inventory",
            items: [
                { to: "/pallet/inventory", label: "Stock Levels", icon: Boxes, badge: "28" },
                { to: "/pallet/warehouses", label: "Warehouses", icon: Warehouse },
                { to: "/pallet/transfers", label: "Transfers", icon: ArrowRightLeft },
            ],
        },
        {
            label: "Procurement",
            items: [
                { to: "/pallet/suppliers", label: "Suppliers", icon: Factory },
                { to: "/pallet/purchase-orders", label: "Purchase Orders", icon: ScrollText, badge: "14" },
            ],
        },
    ],
    "/registry": [
        {
            label: "Marketplace",
            items: [
                { to: "/registry", label: "Browse Extensions", icon: Blocks },
            ],
        },
    ],
    "/iam": [
        {
            label: "Identity & Access",
            items: [
                { to: "/iam/users", label: "Users", icon: UserCog },
                { to: "/iam/users/drivers", label: "Drivers", icon: UserCog },
                { to: "/iam/users/customers", label: "Customers", icon: UserCog },
                { to: "/iam/roles", label: "Roles", icon: KeyRound },
                { to: "/iam/policies", label: "Policies", icon: FileKey },
                { to: "/iam/groups", label: "Groups", icon: UsersRound },
            ],
        },
    ],
    "/settings": [
        {
            label: "Workspace",
            items: [
                { to: "/settings", label: "Organization", icon: Building },
                { to: "/account", label: "My Account", icon: User },
            ],
        },
    ],
};

function pickSection(pathname) {
    if (pathname.startsWith("/fleet-ops")) return { key: "/fleet-ops", title: "FleetOps", subtitle: "Logistics operations", accent: "from-cyan-accent to-[#2979FF]" };
    if (pathname.startsWith("/storefront")) return { key: "/storefront", title: "Storefront", subtitle: "Catalog & marketing", accent: "from-[#7C4DFF] to-[#F50057]" };
    if (pathname.startsWith("/ledger")) return { key: "/ledger", title: "Ledger", subtitle: "Finance & billing", accent: "from-[#00E676] to-[#00E5FF]" };
    if (pathname.startsWith("/pallet")) return { key: "/pallet", title: "Pallet", subtitle: "Inventory & warehouse", accent: "from-[#FFEA00] to-[#FF6D00]" };
    if (pathname.startsWith("/registry")) return { key: "/registry", title: "Registry", subtitle: "Extensions marketplace", accent: "from-[#7C4DFF] to-cyan-accent" };
    if (pathname.startsWith("/developers")) return { key: "/developers", title: "Developers", subtitle: "API & integrations", accent: "from-cyan-accent to-[#7C4DFF]" };
    if (pathname.startsWith("/iam")) return { key: "/iam", title: "IAM", subtitle: "Identity & access", accent: "from-[#FF1744] to-[#FFEA00]" };
    if (pathname.startsWith("/settings")) return { key: "/settings", title: "Settings", subtitle: "Workspace config", accent: "from-white/40 to-white/10" };
    return { key: "/", title: "Console", subtitle: "Overview", accent: "from-cyan-accent to-[#2979FF]" };
}

export default function Sidebar() {
    const location = useLocation();
    const section = pickSection(location.pathname);
    const groups = sections[section.key] || [];

    return (
        <aside
            className="hidden xl:flex flex-col w-[248px] shrink-0 bg-white border-r border-black/[0.06] relative"
            data-testid="console-sidebar"
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0066FF]/40 to-transparent" />
            <div className="px-5 py-5 border-b border-black/[0.06] relative overflow-hidden">
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${section.accent} opacity-[0.18] blur-2xl`} />
                <div className="overline relative">{section.subtitle}</div>
                <div className="font-display text-[22px] font-black tracking-[-0.04em] mt-1 relative text-[#0A0E1A]">{section.title}</div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                {groups.map((group) => (
                    <div key={group.label} className="mb-5">
                        <div className="px-3 mb-2 overline">{group.label}</div>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active =
                                    item.to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname === item.to ||
                                          location.pathname.startsWith(item.to + "/");
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        data-testid={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                                        className={`group relative flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-all ${
                                            active
                                                ? "text-[#0A0E1A] bg-[#0066FF]/[0.08]"
                                                : "text-[#374151] hover:text-[#0A0E1A] hover:bg-black/[0.035]"
                                        }`}
                                    >
                                        {active && (
                                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[#0066FF] shadow-[0_0_8px_rgba(0,102,255,0.5)]" />
                                        )}
                                        <Icon className={`h-4 w-4 transition-colors ${active ? "text-[#0066FF]" : "text-[#4B5563] group-hover:text-[#0A0E1A]"}`} strokeWidth={1.75} />
                                        <span className="flex-1 tracking-[-0.005em] font-medium">{item.label}</span>
                                        {item.badge && (
                                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                active
                                                    ? "bg-[#0066FF]/[0.12] text-[#0040CC] border border-[#0066FF]/25"
                                                    : "bg-black/[0.04] text-[#374151] border border-black/[0.06]"
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {active && <ChevronRight className="h-3 w-3 text-[#0066FF]" strokeWidth={2} />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-3.5 border-t border-black/[0.06] text-[10px] font-mono uppercase tracking-[0.22em] flex items-center justify-between text-[#4B5563]">
                <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse shadow-[0_0_6px_rgba(22,163,74,0.6)]" />
                    Realtime
                </span>
                <span>v3.0.0</span>
            </div>
        </aside>
    );
}
