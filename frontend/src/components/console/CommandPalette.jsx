import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Car,
  MapPin,
  Building,
  LayoutDashboard,
  Bell,
  Settings as SettingsIcon,
  Workflow,
  DollarSign,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { mapOrder, mapDriverRow, mapVehicleRow } from "@/lib/mappers";
import { useEngineAccessContext } from "@/hooks/useEngineAccessContext";
import {
  getCommandPaletteNavigation,
  getCommandPaletteSearchAccess,
} from "@/lib/commandPaletteNavigation";

const iconByKey = {
  dashboard: LayoutDashboard,
  package: Package,
  workflow: Workflow,
  dollar: DollarSign,
  users: Users,
  car: Car,
  map: MapPin,
  building: Building,
  settings: SettingsIcon,
  bell: Bell,
};

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const ctx = useEngineAccessContext();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const navigationItems = useMemo(() => getCommandPaletteNavigation(ctx), [ctx]);
  const searchAccess = useMemo(() => getCommandPaletteSearchAccess(ctx), [ctx]);

  useEffect(() => {
    if (!open) return;

    const tasks = [];
    if (searchAccess.orders) {
      tasks.push(
        fleetopsService.listOrders().then((rows) => (rows || []).slice(0, 12).map(mapOrder)),
      );
    } else {
      tasks.push(Promise.resolve([]));
    }
    if (searchAccess.drivers) {
      tasks.push(
        fleetopsService.listDrivers().then((rows) => (rows || []).slice(0, 8).map(mapDriverRow)),
      );
    } else {
      tasks.push(Promise.resolve([]));
    }
    if (searchAccess.vehicles) {
      tasks.push(
        fleetopsService.listVehicles().then((rows) => (rows || []).slice(0, 8).map(mapVehicleRow)),
      );
    } else {
      tasks.push(Promise.resolve([]));
    }

    let active = true;
    Promise.all(tasks)
      .then(([nextOrders, nextDrivers, nextVehicles]) => {
        if (!active) return;
        setOrders(nextOrders);
        setDrivers(nextDrivers);
        setVehicles(nextVehicles);
      })
      .catch(() => {
        if (active) {
          setOrders([]);
          setDrivers([]);
          setVehicles([]);
        }
      });

    return () => {
      active = false;
    };
  }, [open, searchAccess.orders, searchAccess.drivers, searchAccess.vehicles]);

  function go(path) {
    onOpenChange(false);
    navigate(path);
  }

  const showSearchGroups = searchAccess.orders || searchAccess.drivers || searchAccess.vehicles;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <CommandInput placeholder="Search orders, drivers, vehicles or jump to a page…" data-testid="command-palette-input" />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>No results found.</CommandEmpty>
        {navigationItems.length > 0 ? (
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => {
              const Icon = item.icon || iconByKey[item.iconKey] || LayoutDashboard;
              return (
                <CommandItem
                  key={item.to}
                  onSelect={() => go(item.to)}
                  data-testid={item.testId}
                >
                  <Icon className="mr-2 h-4 w-4" /> {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}
        {showSearchGroups ? <CommandSeparator /> : null}
        {searchAccess.orders ? (
          <CommandGroup heading="Recent orders">
            {orders.map((o) => (
              <CommandItem
                key={o.id}
                onSelect={() => go(`/fleet-ops/operations/orders/${o.id}`)}
                value={`${o.publicId} ${o.customer?.name || ""} ${o.trackingNumber || ""}`}
                data-testid={`command-order-${o.id}`}
              >
                <Package className="mr-2 h-4 w-4" />
                <span className="font-mono text-xs mr-2">{o.publicId}</span>
                <span>{o.customer?.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {searchAccess.orders && (searchAccess.drivers || searchAccess.vehicles) ? <CommandSeparator /> : null}
        {searchAccess.drivers ? (
          <CommandGroup heading="Drivers">
            {drivers.map((d) => (
              <CommandItem
                key={d.id}
                onSelect={() => go(`/fleet-ops/management/drivers/${d.id}`)}
                value={`${d.name} ${d.publicId || ""}`}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{d.name}</span>
                <span className="ml-auto font-mono text-[10px] text-[#4B5563]">{d.publicId}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {searchAccess.drivers && searchAccess.vehicles ? <CommandSeparator /> : null}
        {searchAccess.vehicles ? (
          <CommandGroup heading="Vehicles">
            {vehicles.map((v) => (
              <CommandItem
                key={v.id}
                onSelect={() => go(`/fleet-ops/management/vehicles/${v.id}`)}
                value={`${v.name} ${v.plate || ""}`}
              >
                <Car className="mr-2 h-4 w-4" />
                <span>{v.name}</span>
                <span className="ml-auto font-mono text-[10px] text-[#4B5563]">{v.plate}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
