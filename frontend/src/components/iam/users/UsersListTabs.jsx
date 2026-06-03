import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/iam/users", label: "Users", end: true },
  { to: "/iam/users/drivers", label: "Drivers" },
  { to: "/iam/users/customers", label: "Customers" },
];

export default function UsersListTabs() {
  return (
    <nav className="flex gap-1 border-b border-black/[0.08] mb-4" data-testid="users-list-tabs">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-[#0066FF] text-[#0066FF]"
                : "border-transparent text-[#4B5563] hover:text-[#0A0E1A]",
            )
          }
          data-testid={`users-tab-${tab.label.toLowerCase()}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
