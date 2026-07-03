import { useCallback, useEffect, useMemo, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { parseApiError } from "@/lib/errors";

const STEPS = ["provider", "credentials", "test", "link"];

function telematicUuid(record) {
  return record?.uuid || record?.id || "";
}

function providerKey(provider) {
  return provider?.key || provider?.id || provider?.name || "";
}

function emptyCredentialFields(provider) {
  const fields = provider?.required_fields || [];
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export default function TelematicsSetupWizard({ open, onOpenChange, onComplete }) {
  const [step, setStep] = useState(0);
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("");
  const [credentialFields, setCredentialFields] = useState({});
  const [deviceId, setDeviceId] = useState("");
  const [telematicId, setTelematicId] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find((p) => providerKey(p) === provider),
    [providers, provider],
  );

  useEffect(() => {
    if (!open) return;
    fleetopsService.listTelematicProviders().then(setProviders).catch(() => setProviders([]));
  }, [open]);

  useEffect(() => {
    if (!selectedProvider) return;
    setCredentialFields(emptyCredentialFields(selectedProvider));
  }, [selectedProvider]);

  const reset = () => {
    setStep(0);
    setProvider("");
    setCredentialFields({});
    setDeviceId("");
    setTelematicId("");
  };

  const handleClose = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const buildCredentials = () => {
    const creds = { ...credentialFields };
    for (const field of selectedProvider?.required_fields || []) {
      if (field.required && !String(creds[field.name] ?? "").trim()) {
        throw new Error(`${field.label || field.name} is required`);
      }
    }
    return creds;
  };

  const ensureTelematicRecord = useCallback(async (creds) => {
    if (telematicId) return telematicId;
    const created = await fleetopsService.createTelematic({
      name: `${provider} telematics`,
      provider,
      status: "initialized",
      credentials: creds,
    });
    const id = telematicUuid(created);
    if (!id) {
      throw new Error("Telematic record was created but no id was returned");
    }
    setTelematicId(id);
    return id;
  }, [provider, telematicId]);

  const testCredentials = async () => {
    setBusy(true);
    try {
      const creds = buildCredentials();
      const result = await fleetopsService.testTelematicCredentials(provider, { credentials: creds, provider });
      if (result?.success === false) {
        toast.error(result?.message || "Credential test failed");
        return;
      }
      const id = await ensureTelematicRecord(creds);
      await fleetopsService.updateTelematic(id, { credentials: creds });
      toast.success("Credentials verified");
      setStep(2);
    } catch (err) {
      toast.error(parseApiError(err, "Credential test failed"));
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setBusy(true);
    try {
      const creds = buildCredentials();
      const id = telematicId || (await ensureTelematicRecord(creds));
      const result = await fleetopsService.testTelematicConnection(id, {});
      if (result?.success === false) {
        toast.error(result?.message || "Connection test failed");
        return;
      }
      toast.success("Connection OK");
      setStep(3);
    } catch (err) {
      toast.error(parseApiError(err, "Connection test failed"));
    } finally {
      setBusy(false);
    }
  };

  const skipConnectionTest = () => {
    setStep(3);
  };

  const linkDevice = async () => {
    if (!deviceId?.trim()) {
      toast.error("Enter a device ID to link");
      return;
    }
    setBusy(true);
    try {
      const creds = buildCredentials();
      const id = telematicId || (await ensureTelematicRecord(creds));
      await fleetopsService.linkTelematicDevice(id, {
        external_id: deviceId.trim(),
        device_name: deviceId.trim(),
      });
      toast.success("Device linked");
      onComplete?.();
      handleClose(false);
    } catch (err) {
      toast.error(parseApiError(err, "Link failed"));
    } finally {
      setBusy(false);
    }
  };

  const discover = async () => {
    if (!provider) {
      toast.error("Select a provider first");
      return;
    }
    setBusy(true);
    try {
      const creds = buildCredentials();
      const id = telematicId || (await ensureTelematicRecord(creds));
      const result = await fleetopsService.discoverTelematic(id, {});
      toast.success(`Discovery started${result?.job_id ? ` (job ${result.job_id})` : ""}`);
    } catch (err) {
      toast.error(parseApiError(err, "Discover failed"));
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
            <Select
              value={provider}
              onValueChange={(value) => {
                setProvider(value);
                const next = providers.find((p) => providerKey(p) === value);
                setCredentialFields(emptyCredentialFields(next));
              }}
            >
              <SelectTrigger data-testid="telematics-wizard-provider">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={providerKey(p)} value={providerKey(p)}>
                    {p.name || p.label || providerKey(p)}
                  </SelectItem>
                ))}
                {!providers.length && (
                  <SelectItem value="generic">Generic telematics</SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedProvider?.description ? (
              <p className="text-xs text-[#6B7280]">{selectedProvider.description}</p>
            ) : null}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            {(selectedProvider?.required_fields || []).map((field) => (
              <div key={field.name} className="space-y-1">
                <Label htmlFor={`telematics-cred-${field.name}`}>
                  {field.label || field.name}
                  {field.required ? " *" : ""}
                </Label>
                <Input
                  id={`telematics-cred-${field.name}`}
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder || ""}
                  value={credentialFields[field.name] ?? ""}
                  onChange={(e) =>
                    setCredentialFields((prev) => ({ ...prev, [field.name]: e.target.value }))
                  }
                  data-testid={`telematics-wizard-cred-${field.name}`}
                />
              </div>
            ))}
            {!selectedProvider?.required_fields?.length ? (
              <p className="text-sm text-[#6B7280]">No credential fields defined for this provider.</p>
            ) : null}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-[#4B5563]">Test connection to provider before linking hardware.</p>
            <div className="flex flex-wrap gap-2">
              {telematicId ? (
                <Button type="button" variant="outline" size="sm" onClick={discover} disabled={busy}>
                  Discover devices
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={skipConnectionTest} disabled={busy}>
                Skip to link device
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2">
            <Label>External device ID to link</Label>
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
