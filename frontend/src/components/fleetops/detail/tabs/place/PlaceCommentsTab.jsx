import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fleetopsService } from "@/services/fleetops";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";

export default function PlaceCommentsTab({ placeId, enabled = true }) {
  const ability = useFleetopsAbility();
  const canEdit = ability.canUpdateOrder;
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !placeId) return;
    setLoading(true);
    try {
      const meta = await fleetopsService.getPlaceMeta(placeId);
      setComments(Array.isArray(meta.operational_comments) ? meta.operational_comments : []);
    } finally {
      setLoading(false);
    }
  }, [placeId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const saveComment = async () => {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    try {
      const next = [
        { id: `c-${Date.now()}`, body, created_at: new Date().toISOString(), author: "You" },
        ...comments,
      ];
      await fleetopsService.updatePlaceMeta(placeId, { operational_comments: next });
      setComments(next);
      setDraft("");
      toast.success("Comment saved");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not save comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4" data-testid="place-comments-tab">
      {canEdit && (
        <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add operational note…"
            rows={3}
            data-testid="place-comment-input"
          />
          <Button size="sm" disabled={busy || !draft.trim()} onClick={saveComment} data-testid="place-comment-save">
            Post comment
          </Button>
        </div>
      )}
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {loading ? (
          <div className="p-6 text-sm text-[#4B5563]">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="px-4 py-3 text-sm">
              <div className="text-[#0A0E1A]">{c.body}</div>
              <div className="text-[10px] font-mono text-[#6B7280] mt-1">
                {c.author || "Operator"} · {c.created_at ? String(c.created_at).slice(0, 16) : ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
