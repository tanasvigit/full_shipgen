import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export default function OrderLabelDialog({ open, onOpenChange, orderId, orderPublicId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);

  useEffect(() => {
    if (!open || !orderId) return undefined;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setPdfSrc(null);
      try {
        const data = await fleetopsService.getOrderLabel(orderId, "base64");
        const b64 = typeof data === "string" ? data : data?.base64 || data?.content;
        if (!b64) throw new Error("No label data returned.");
        if (active) setPdfSrc(`data:application/pdf;base64,${b64}`);
      } catch (err) {
        if (active) setError(parseFleetopsApiError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, orderId]);

  const download = () => {
    if (!pdfSrc) return;
    const a = document.createElement("a");
    a.href = pdfSrc;
    a.download = `order-label-${orderPublicId || orderId}.pdf`;
    a.click();
  };

  const print = () => {
    if (!pdfSrc) return;
    const w = window.open(pdfSrc);
    w?.print();
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Order label"
      description={orderPublicId ? `Shipping label for ${orderPublicId}` : "Shipping label preview"}
      submitLabel="Close"
      onSubmit={() => onOpenChange(false)}
      testId="order-label-dialog"
      size="xl"
      submitDisabled={loading}
    >
      <div className="space-y-3 min-h-[320px]" data-testid="order-label-body">
        {loading && <p className="text-sm text-[#4B5563]">Loading label…</p>}
        {error && (
          <p className="text-sm text-[#B91C1C] bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">{error}</p>
        )}
        {pdfSrc && (
          <>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={download} data-testid="order-label-download">
                <Download className="h-3.5 w-3.5 mr-1" /> Download
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={print} data-testid="order-label-print">
                <Printer className="h-3.5 w-3.5 mr-1" /> Print
              </Button>
            </div>
            <iframe title="Order label" src={pdfSrc} className="w-full h-[480px] border border-black/[0.08] rounded-md" />
          </>
        )}
      </div>
    </FleetOpsFormDialog>
  );
}
