import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Play, Route } from "lucide-react";

/**
 * Position history trail + replay trigger (G077).
 */
export default function PositionReplayPanel({
  subjectUuid,
  subjectLabel = "Subject",
  onTrailChange,
  className = "",
}) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [speed, setSpeed] = useState("1");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!subjectUuid) return;
    setLoading(true);
    try {
      const rows = await fleetopsService.listPositions({ subject_uuid: subjectUuid, limit: 200 });
      setPositions(rows);
      const trail = rows
        .map((p) => {
          const lat = p.latitude ?? p.location?.latitude ?? p.coordinates?.[1];
          const lng = p.longitude ?? p.location?.longitude ?? p.coordinates?.[0];
          if (lat == null || lng == null) return null;
          return [Number(lat), Number(lng)];
        })
        .filter(Boolean);
      onTrailChange?.(trail.length > 1 ? [{ points: trail, color: "#6366F1", highlighted: true }] : []);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load positions");
      setPositions([]);
      onTrailChange?.([]);
    } finally {
      setLoading(false);
    }
  }, [subjectUuid, onTrailChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const startReplay = async () => {
    const ids = positions.map((p) => p.uuid || p.id).filter(Boolean);
    if (!ids.length) {
      toast.error("No positions to replay");
      return;
    }
    if (!channelId.trim()) {
      toast.error("Channel ID is required for replay");
      return;
    }
    setBusy(true);
    try {
      await fleetopsService.replayPositions({
        position_ids: ids,
        channel_id: channelId.trim(),
        speed: Number(speed) || 1,
        subject_uuid: subjectUuid,
      });
      toast.success(`Replay started (${ids.length} positions)`);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Replay failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`rounded-md border border-black/[0.08] bg-white p-4 space-y-3 ${className}`}
      data-testid="position-replay-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="overline flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5" /> Position replay
        </div>
        <Button type="button" size="sm" variant="outline" onClick={load} disabled={loading || !subjectUuid}>
          Refresh
        </Button>
      </div>
      <p className="text-xs text-[#6B7280]">
        {subjectLabel}: <span className="font-mono">{subjectUuid || "—"}</span> · {positions.length} points
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Realtime channel ID</Label>
          <Input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="company or order channel"
            data-testid="position-replay-channel"
          />
        </div>
        <div>
          <Label className="text-xs">Speed</Label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            data-testid="position-replay-speed"
          />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="bg-[#0066FF] hover:bg-[#0040CC]"
        disabled={busy || !positions.length}
        onClick={startReplay}
        data-testid="position-replay-start"
      >
        <Play className="h-3.5 w-3.5 mr-1" /> Start replay
      </Button>
    </section>
  );
}
