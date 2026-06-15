import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fleetopsService } from "@/services/fleetops";
import { mapFleet } from "@/lib/mappers";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function FleetListFilters({ filters, onChange, serviceAreaOptions = [], vendorOptions = [] }) {
  const [parentFleets, setParentFleets] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fleetopsService
      .listFleets({ limit: 500, parents_only: 1, "filter[parentsOnly]": 1 })
      .then((rows) => setParentFleets((rows || []).map(mapFleet)))
      .catch(() => setParentFleets([]));
  }, []);

  useEffect(() => {
    if (!filters.service_area) {
      setZones([]);
      return;
    }
    fleetopsService
      .listServiceAreaZones(filters.service_area)
      .then((rows) => setZones(rows || []))
      .catch(() => setZones([]));
  }, [filters.service_area]);

  const patch = (next) => onChange?.({ ...filters, page: 1, ...next });

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4" data-testid="fleets-list-filters">
      <Select value={filters.status || "all"} onValueChange={(v) => patch({ status: v })}>
        <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="fleets-filter-status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.service_area || "all"}
        onValueChange={(v) => patch({ service_area: v === "all" ? "" : v, zone: "" })}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs" data-testid="fleets-filter-service-area">
          <SelectValue placeholder="Service area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All service areas</SelectItem>
          {serviceAreaOptions.map((sa) => (
            <SelectItem key={sa.id} value={String(sa.id)}>
              {sa.label || sa.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.zone || "all"}
        onValueChange={(v) => patch({ zone: v === "all" ? "" : v })}
        disabled={!filters.service_area}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs" data-testid="fleets-filter-zone">
          <SelectValue placeholder="Zone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All zones</SelectItem>
          {zones.map((z) => (
            <SelectItem key={z.uuid || z.id} value={String(z.uuid || z.id)}>
              {z.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.vendor || "all"} onValueChange={(v) => patch({ vendor: v === "all" ? "" : v })}>
        <SelectTrigger className="h-8 w-[150px] text-xs" data-testid="fleets-filter-vendor">
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All vendors</SelectItem>
          {vendorOptions.map((v) => (
            <SelectItem key={v.id} value={String(v.id)}>
              {v.label || v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.parent_fleet || "all"}
        onValueChange={(v) => patch({ parent_fleet: v === "all" ? "" : v })}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs" data-testid="fleets-filter-parent-fleet">
          <SelectValue placeholder="Parent fleet" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any parent</SelectItem>
          {parentFleets.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
        <Checkbox
          checked={Boolean(filters.parents_only)}
          onCheckedChange={(v) => patch({ parents_only: Boolean(v) })}
          data-testid="fleets-filter-parents-only"
        />
        Top-level only
      </label>
    </div>
  );
}
