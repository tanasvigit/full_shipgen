import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function OrderNotesTab({ order, rawOrder, editable = false, onSaved }) {
  const initialNotes = order?.notes || rawOrder?.notes || rawOrder?.dispatch_notes || "";
  const instructions = rawOrder?.instructions || "";
  const [notes, setNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const save = async () => {
    if (!order?.id) return;
    setBusy(true);
    try {
      await fleetopsService.patchOrder(order.id, { notes });
      toast.success("Notes saved");
      onSaved?.();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="overline">Notes</div>
          {editable && (
            <Button size="sm" variant="outline" className="h-8" disabled={busy} onClick={save} data-testid="order-notes-save">
              Save
            </Button>
          )}
        </div>
        {editable ? (
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} className="text-sm" />
        ) : (
          <p className="text-sm text-[#1F2937] whitespace-pre-wrap">{notes || "—"}</p>
        )}
      </div>
      {instructions && (
        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-2">Instructions</div>
          <p className="text-sm text-[#1F2937] whitespace-pre-wrap">{instructions}</p>
        </div>
      )}
    </div>
  );
}
