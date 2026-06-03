import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function ServiceRateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [baseFee, setBaseFee] = useState("");
  const [perMile, setPerMile] = useState("");
  const [perKm, setPerKm] = useState("");
  const [minimumFee, setMinimumFee] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [zones, setZones] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const row = await fleetopsService.getServiceRate(id);
        if (cancelled) return;
        setName(row?.name || "");
        setServiceType(row?.service_type || row?.serviceType || "");
        setBaseFee(String(row?.base_fee ?? row?.baseFee ?? ""));
        setPerMile(String(row?.per_mile ?? row?.perMile ?? ""));
        setPerKm(String(row?.per_km ?? row?.perKm ?? ""));
        setMinimumFee(String(row?.minimum_fee ?? row?.minimumFee ?? ""));
        setCurrency(row?.currency || "USD");
        setZones(typeof row?.zones === "string" ? row.zones : JSON.stringify(row?.zones || {}, null, 2));
      } catch (err) {
        toast.error(parseFleetopsApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const save = async () => {
    setBusy(true);
    try {
      let zonesParsed;
      if (zones.trim()) {
        try {
          zonesParsed = JSON.parse(zones);
        } catch {
          zonesParsed = zones;
        }
      }
      const values = {
        name,
        service_type: serviceType,
        base_fee: baseFee ? Number(baseFee) : undefined,
        per_mile: perMile ? Number(perMile) : undefined,
        per_km: perKm ? Number(perKm) : undefined,
        minimum_fee: minimumFee ? Number(minimumFee) : undefined,
        currency,
        zones: zonesParsed,
      };
      if (isNew) {
        const row = await fleetopsService.createServiceRate(values);
        toast.success("Service rate created");
        navigate(`/fleet-ops/operations/service-rates/${row?.uuid || row?.id}`);
      } else {
        await fleetopsService.updateServiceRate(id, values);
        toast.success("Service rate updated");
      }
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="service-rate-form-page">
      <PageHeader
        title={isNew ? "New service rate" : "Edit service rate"}
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Service rates", to: "/fleet-ops/operations/service-rates" }]}
      />
      <div className="p-6 max-w-lg space-y-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} data-testid="service-rate-name" />
        </div>
        <div>
          <Label>Service type</Label>
          <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} disabled={loading} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Base fee</Label>
            <Input type="number" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label>Minimum fee</Label>
            <Input type="number" value={minimumFee} onChange={(e) => setMinimumFee(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label>Per mile</Label>
            <Input type="number" value={perMile} onChange={(e) => setPerMile(e.target.value)} disabled={loading} />
          </div>
          <div>
            <Label>Per km</Label>
            <Input type="number" value={perKm} onChange={(e) => setPerKm(e.target.value)} disabled={loading} />
          </div>
        </div>
        <div>
          <Label>Currency</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>Zones / matrix (JSON)</Label>
          <Textarea rows={4} value={zones} onChange={(e) => setZones(e.target.value)} disabled={loading} placeholder='{"zone_a": 1.2}' />
        </div>
        <Button disabled={busy || loading} onClick={save} data-testid="service-rate-save">
          Save
        </Button>
      </div>
    </div>
  );
}
