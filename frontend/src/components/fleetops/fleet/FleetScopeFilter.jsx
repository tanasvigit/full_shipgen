import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapFleet } from "@/lib/mappers";

/**
 * Operational fleet scope filter — limits drivers, vehicles, orders, and schedule views.
 */
export default function FleetScopeFilter({
  value = "all",
  onChange,
  className = "w-[200px]",
  testId = "fleet-scope-filter",
  placeholder = "All fleets",
}) {
  const [fleets, setFleets] = useState([]);

  useEffect(() => {
    let active = true;
    fleetopsService
      .listFleets({ limit: 500, sort: "name", sort_dir: "asc" })
      .then((rows) => {
        if (active) setFleets((rows || []).map(mapFleet));
      })
      .catch(() => {
        if (active) setFleets([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Select value={value || "all"} onValueChange={(v) => onChange?.(v === "all" ? "" : v)}>
      <SelectTrigger className={className} data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {fleets.map((f) => (
          <SelectItem key={f.id} value={String(f.id)}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
