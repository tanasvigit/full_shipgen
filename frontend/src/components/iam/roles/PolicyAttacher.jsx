import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mapPolicy } from "@/lib/mappers";

/**
 * Attach policies to a role (Ember policy-attacher parity).
 * @param {{ policies: object[], available: object[], value: object[], onChange: (next: object[]) => void, disabled?: boolean }} props
 */
export default function PolicyAttacher({ policies = [], available = [], value = [], onChange, disabled = false }) {
  const [pick, setPick] = useState("");
  const selected = useMemo(() => value.map(mapPolicy), [value]);
  const options = useMemo(() => {
    const selectedIds = new Set(selected.map((p) => String(p.id)));
    return available.map(mapPolicy).filter((p) => p.id && !selectedIds.has(String(p.id)));
  }, [available, selected]);

  const addPolicy = (id) => {
    if (!id || disabled) return;
    const policy = available.find((p) => String(p.id || p.uuid) === String(id));
    if (!policy) return;
    onChange([...value, policy]);
    setPick("");
  };

  const removePolicy = (id) => {
    if (disabled) return;
    onChange(value.filter((p) => String(p.id || p.uuid) !== String(id)));
  };

  return (
    <div className="space-y-3" data-testid="policy-attacher">
      <Select value={pick} onValueChange={(v) => addPolicy(v)} disabled={disabled || options.length === 0}>
        <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="policy-attacher-select">
          <SelectValue placeholder={options.length ? "Select policy…" : "No more policies"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
              {p.service ? ` · ${p.service}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border border-black/[0.08] rounded-md bg-[#F9FAFB]">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[#0066FF]"
            >
              {p.name}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removePolicy(p.id)}
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </span>
          ))}
        </div>
      )}
      {policies.length === 0 && selected.length === 0 && (
        <p className="text-xs text-[#4B5563]">No policies attached.</p>
      )}
    </div>
  );
}
