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
import { Package, Users, Car, MapPin, Building, LayoutDashboard, Bell, Settings as SettingsIcon, UserCog, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { mapOrder, mapDriverRow, mapVehicleRow } from "@/lib/mappers";

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async () => {
      try {
        const [o, d, v] = await Promise.all([
          fleetopsService.listOrders(),
          fleetopsService.listDrivers(),
          fleetopsService.listVehicles(),
        ]);
        if (!active) return;
        setOrders((o || []).slice(0, 12).map(mapOrder));
        setDrivers((d || []).slice(0, 8).map(mapDriverRow));
        setVehicles((v || []).slice(0, 8).map(mapVehicleRow));
      } catch {
        if (active) {
          setOrders([]);
          setDrivers([]);
          setVehicles([]);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [open]);

  function go(path) {
    onOpenChange(false);
    navigate(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <CommandInput placeholder="Search orders, drivers, vehicles or jump to a page…" data-testid="command-palette-input" />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/fleet-ops/operations/orders")}>
            <Package className="mr-2 h-4 w-4" /> Orders
          </CommandItem>
          <CommandItem onSelect={() => go("/fleet-ops/management/drivers")}>
            <Users className="mr-2 h-4 w-4" /> Drivers
          </CommandItem>
          <CommandItem onSelect={() => go("/fleet-ops/management/vehicles")}>
            <Car className="mr-2 h-4 w-4" /> Vehicles
          </CommandItem>
          <CommandItem onSelect={() => go("/fleet-ops/management/places")}>
            <MapPin className="mr-2 h-4 w-4" /> Places
          </CommandItem>
          <CommandItem onSelect={() => go("/fleet-ops/management/fleets")}>
            <Building className="mr-2 h-4 w-4" /> Fleets
          </CommandItem>
          <CommandItem onSelect={() => go("/iam/users")}>
            <UserCog className="mr-2 h-4 w-4" /> Users
          </CommandItem>
          <CommandItem onSelect={() => go("/iam/roles")}>
            <KeyRound className="mr-2 h-4 w-4" /> Roles
          </CommandItem>
          <CommandItem onSelect={() => go("/notifications")}>
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <SettingsIcon className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
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
        <CommandSeparator />
        <CommandGroup heading="Drivers">
          {drivers.map((d) => (
            <CommandItem key={d.id} onSelect={() => go(`/fleet-ops/management/drivers/${d.id}`)} value={`${d.name} ${d.publicId || ""}`}>
              <Users className="mr-2 h-4 w-4" />
              <span>{d.name}</span>
              <span className="ml-auto font-mono text-[10px] text-[#4B5563]">{d.publicId}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Vehicles">
          {vehicles.map((v) => (
            <CommandItem key={v.id} onSelect={() => go(`/fleet-ops/management/vehicles/${v.id}`)} value={`${v.name} ${v.plate || ""}`}>
              <Car className="mr-2 h-4 w-4" />
              <span>{v.name}</span>
              <span className="ml-auto font-mono text-[10px] text-[#4B5563]">{v.plate}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
