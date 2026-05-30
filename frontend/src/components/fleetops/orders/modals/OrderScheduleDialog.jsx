import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

/**
 * Schedule one or many orders (sequential API when bulk — no dedicated bulk schedule endpoint).
 */
export default function OrderScheduleDialog({
  open,
  onOpenChange,
  orderId,
  orderIds,
  driverId,
  onScheduled,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = orderIds?.length ? orderIds : orderId ? [orderId] : [];
  const isBulk = ids.length > 1;

  const handleSave = async () => {
    if (!ids.length || !date) {
      toast.error("Pick a date");
      return;
    }
    setBusy(true);
    try {
      const scheduledAt = time ? `${date}T${time}` : date;
      const options = {
        scheduledAt,
        date,
        time: time || undefined,
        driverId: driverId || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      if (isBulk) {
        const { successful, failed } = await fleetopsService.bulkScheduleOrders(ids, options);
        if (failed.length) {
          toast.error(`Scheduled ${successful.length}/${ids.length} — ${failed.length} failed`);
        } else {
          toast.success(`Scheduled ${successful.length} order(s)`);
        }
      } else {
        await fleetopsService.scheduleOrder(ids[0], options);
        toast.success("Order scheduled");
      }
      onScheduled?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="order-schedule-dialog">
        <DialogHeader>
          <DialogTitle>{isBulk ? `Schedule ${ids.length} orders` : "Schedule order"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="schedule-date">Date</Label>
            <Input id="schedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="schedule-time">Time (optional)</Label>
            <Input id="schedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy} data-testid="order-schedule-save">
            Save schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
