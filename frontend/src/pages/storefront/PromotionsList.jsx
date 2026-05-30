import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapStoreCustomer } from "@/lib/mappers";
import { toast } from "sonner";

export default function PromotionsList() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const loadContext = useCallback(async () => {
    try {
      const [storeRaw, custRaw] = await Promise.all([
        storefrontService.listStores({ limit: 50 }),
        storefrontService.listCustomers({ limit: 500 }),
      ]);
      const mappedStores = storeRaw || [];
      setStores(mappedStores);
      setCustomers((custRaw || []).map(mapStoreCustomer));
      if (mappedStores.length && !storeId) {
        const first = mappedStores[0];
        setStoreId(first.public_id || first.uuid || first.id);
      }
    } catch {
      setStores([]);
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const audienceLabel =
    audience === "all"
      ? `All customers (${customers.length})`
      : audience === "vip"
        ? "VIP (meta tier)"
        : audience === "active"
          ? "Active customers"
          : "Re-engagement";

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Provide a title and body");
      return;
    }
    if (!storeId) {
      toast.error("Select a store for this campaign");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        store: storeId,
        select_all: audience === "all",
      };
      if (audience !== "all") {
        const filtered = customers.filter((c) => {
          if (audience === "vip") return c.status === "vip";
          if (audience === "active") return c.status === "active";
          return c.status === "churned" || c.orders === 0;
        });
        payload.customers = filtered.map((c) => c.id);
        if (!payload.customers.length) {
          toast.error("No customers match this audience");
          setLoading(false);
          return;
        }
      }
      const result = await storefrontService.sendPushNotification(payload);
      setLastSent({
        title: title.trim(),
        sent: Number(result?.sent_count ?? 0),
        total: Number(result?.total ?? 0),
        at: new Date().toISOString(),
      });
      toast.success(`Push sent to ${result?.sent_count ?? 0} customer(s)`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to send push notification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="promotions-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Promotions" }]}
        overline="Marketing"
        title="Push Promotions"
        description="Send promotional push notifications via storefront/actions/send-push-notification."
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Compose</div>
          {stores.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Store</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent className="bg-white border-black/[0.08]">
                  {stores.map((s) => {
                    const id = s.public_id || s.uuid || s.id;
                    return (
                      <SelectItem key={id} value={String(id)}>
                        {s.name || id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          {stores.length === 0 && (
            <p className="text-xs text-[#4B5563]">No stores found. Create a store in storefront before sending campaigns.</p>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekend Special — 20% off all pizza"
              className="bg-[#F1F2F5] border-black/[0.08]"
              data-testid="promotion-title"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="This weekend only — get 20% off every order over $25."
              className="bg-[#F1F2F5] border-black/[0.08] min-h-[120px]"
              data-testid="promotion-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-black/[0.08]">
                <SelectItem value="all">{audienceLabel}</SelectItem>
                <SelectItem value="vip">VIP customers</SelectItem>
                <SelectItem value="active">Active customers</SelectItem>
                <SelectItem value="churned">Re-engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.08]">
            <div className="text-xs text-[#4B5563] font-mono">Preview · iOS</div>
            <Button onClick={send} disabled={loading || !stores.length} className="bg-blue-600 hover:bg-blue-700" data-testid="promotion-send">
              <Send className="h-3.5 w-3.5 mr-1.5" /> {loading ? "Sending…" : "Send campaign"}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-black/[0.08] rounded-md p-5">
            <div className="overline mb-3 flex items-center gap-2">
              <Megaphone className="h-3 w-3" /> Preview
            </div>
            <div className="bg-[#F1F2F5] border border-black/[0.08] rounded-md p-3">
              <div className="flex items-start gap-2">
                <div className="h-9 w-9 bg-blue-600 rounded-sm grid place-items-center font-display font-black text-sm text-white">F</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0A0E1A]">Fleetbase</span>
                    <span className="text-[10px] text-[#4B5563] ml-auto">now</span>
                  </div>
                  <div className="text-sm font-medium text-[#0A0E1A] mt-0.5">{title || "Notification title appears here"}</div>
                  <div className="text-xs text-[#374151] mt-0.5">{body || "Body text shows up here."}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-md p-5">
            <div className="overline mb-3">Last send</div>
            {lastSent ? (
              <div className="text-sm">
                <div className="font-medium">{lastSent.title}</div>
                <div className="text-[10px] font-mono text-[#4B5563] mt-1">
                  {lastSent.sent} / {lastSent.total} delivered
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#4B5563]">No campaigns sent this session. Historical campaign analytics are not exposed on this API.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
