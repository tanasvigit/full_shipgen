import { useCallback, useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const STEPS = ["provider", "credentials", "test", "link"];

export default function TelematicsSetupWizard({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(0);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("");
  const [credentials, setCredentials] = useState("{}");
  const [deviceId, setDeviceId] = useState("");
  const [telematicId, setTelematicId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fleetopsService.listTelematicProviders().then(setProviders).catch(() => setProviders([]));
  }, [open]);

  const reset = () => {
    setStep(0);
    setProvider("");
    setCredentials("{}");
    setDeviceId("");
    setTelematicId("");
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const testCredentials = async () => {
    setBusy(true);
    try {
      let creds = {};
      try {
        creds = JSON.parse(credentials);
      } catch {
        toast.error("Credentials must be valid JSON");
        return;
      }
      await fleetopsService.testTelematicCredentials(provider, { credentials: creds, provider });
      toast.success("Credentials verified");
      setStep(2);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Credential test failed");
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    if (!telematicId) {
      setStep(3);
      return;
    }
    setBusy(true);
    try {
      await fleetopsService.testTelematicConnection(telematicId, {});
      toast.success("Connection OK");
      setStep(3);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Connection test failed");
    } finally {
      setBusy(false);
    }
  };

  const linkDevice = async () => {
    setBusy(true);
    try {
      await fleetopsService.linkTelematicDevice({
        provider,
        device: deviceId,
        device_id: deviceId,
        telematic: telematicId,
      });
      toast.success("Device linked");
      onComplete?.();
      handleClose(false);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Link failed");
    } finally {
      setBusy(false);
    }
  };

  const discover = async () => {
    setBusy(true);
    try {
      const result = await fleetopsService.discoverTelematic({ provider });
      toast.success(`Discovered ${result?.devices?.length || 0} device(s)`);
      setStep(2);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Discover failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={handleClose}
      title="Telematics setup"
      description={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
      submitLabel={step === 3 ? "Link device" : "Next"}
      busy={busy}
      onSubmit={async (e) => {
        e?.preventDefault?.();
        if (step === 0) {
          if (!provider) {
            toast.error("Select a provider");
            return;
          }
          setStep(1);
        } else if (step === 1) {
          await testCredentials();
        } else if (step === 2) {
          await testConnection();
        } else {
          await linkDevice();
        }
      }}
      testId="telematics-setup-wizard"
      size="lg"
    >
      <div className="space-y-4" data-testid="telematics-wizard-body">
        {step === 0 && (
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger data-testid="telematics-wizard-provider">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id || p.key || p.name} value={p.key || p.id || p.name}>
                    {p.name || p.key || p.id}
                  </SelectItem>
                ))}
                {!providers.length && (
                  <SelectItem value="generic">Generic telematics</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={discover} disabled={!provider || busy}>
              Discover devices
            </Button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-2">
            <Label>Credentials (JSON)</Label>
            <Input value={credentials} onChange={(e) => setCredentials(e.target.value)} data-testid="telematics-wizard-credentials" />
            <Label>Telematic record ID (optional)</Label>
            <Input value={telematicId} onChange={(e) => setTelematicId(e.target.value)} placeholder="UUID after create" />
          </div>
        )}
        {step === 2 && (
          <p className="text-sm text-[#4B5563]">Test connection to provider before linking hardware.</p>
        )}
        {step === 3 && (
          <div className="space-y-2">
            <Label>Device ID to link</Label>
            <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} data-testid="telematics-wizard-device-id" />
          </div>
        )}
      </div>
    </FleetOpsFormDialog>
  );
}

export function TelematicsSetupButton({ onComplete }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} data-testid="telematics-setup-open">
        <Plus className="h-3.5 w-3.5 mr-1" /> Setup telematics
      </Button>
      <TelematicsSetupWizard open={open} onOpenChange={setOpen} onComplete={onComplete} />
    </>
  );
}
