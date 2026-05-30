import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        const fee = row?.base_fee ?? row?.baseFee;
        setBaseFee(fee != null && fee !== "" ? String(fee) : "");
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
      const values = { name, service_type: serviceType, base_fee: baseFee ? Number(baseFee) : undefined };
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
      <div className="p-6 max-w-md space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>Service type</Label>
          <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} disabled={loading} />
        </div>
        <div>
          <Label>Base fee</Label>
          <Input type="number" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} disabled={loading} />
        </div>
        <Button disabled={busy || loading} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
