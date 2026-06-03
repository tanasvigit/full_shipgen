import { useCallback, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { Label } from "@/components/ui/label";

/**
 * Load service rates applicable to a route (G011 for-route picker).
 */
export default function ServiceRatesForRoutePicker({ routeId, value, onChange, disabled }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!routeId) {
      setRates([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fleetopsService.getServiceRatesForRoute(routeId);
      setRates(rows);
    } catch {
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-1.5" data-testid="service-rates-for-route-picker">
      <Label className="text-xs font-mono uppercase text-[#374151]">Service rate (for route)</Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled || loading || !routeId}>
        <SelectTrigger data-testid="service-rates-for-route-select">
          <SelectValue placeholder={loading ? "Loading rates…" : routeId ? "Select rate" : "Save route first"} />
        </SelectTrigger>
        <SelectContent>
          {rates.map((r) => (
            <SelectItem key={r.uuid || r.id} value={String(r.uuid || r.id)}>
              {r.name || r.public_id} · {r.service_type || r.serviceType || "—"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
