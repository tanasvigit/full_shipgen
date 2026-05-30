import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fleetopsService } from "@/services/fleetops";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function PlaceRulesTab({ placeId, enabled = true }) {
  const ability = useFleetopsAbility();
  const canEdit = ability.canUpdateOrder;
  const [rules, setRules] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !placeId) return;
    setLoading(true);
    try {
      const meta = await fleetopsService.getPlaceMeta(placeId);
      setRules(Array.isArray(meta.rules) ? meta.rules : []);
    } finally {
      setLoading(false);
    }
  }, [placeId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next) => {
    setBusy(true);
    try {
      await fleetopsService.updatePlaceMeta(placeId, { rules: next });
      setRules(next);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not save rules");
    } finally {
      setBusy(false);
    }
  };

  const addRule = async () => {
    const text = draft.trim();
    if (!text) return;
    await persist([...rules, { id: `r-${Date.now()}`, text }]);
    setDraft("");
    toast.success("Rule added");
  };

  const removeRule = async (id) => {
    await persist(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="p-4 space-y-4" data-testid="place-rules-tab">
      {canEdit && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Check-in required at arrival"
            data-testid="place-rule-input"
          />
          <Button size="sm" disabled={busy || !draft.trim()} onClick={addRule} data-testid="place-rule-add">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      )}
      <div className="bg-white border border-black/[0.08] rounded-md p-4">
        {loading ? (
          <p className="text-sm text-[#4B5563]">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-[#4B5563]">No delivery rules configured.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rules.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2">
                <span>{r.text || r.rule || JSON.stringify(r)}</span>
                {canEdit && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => removeRule(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
