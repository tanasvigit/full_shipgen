import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

function normalizeComment(row) {
  return {
    id: row?.uuid || row?.id || row?.public_id,
    body: row?.content || row?.body || row?.message || "",
    created_at: row?.created_at,
    author: row?.author || row?.user,
    _optimistic: row?._optimistic,
  };
}

export function useOrderComments(orderId, { enabled = true, onRealtimeRefresh } = {}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    if (!orderId || !enabled) return;
    setLoading(true);
    try {
      const rows = await fleetopsService.listOrderComments(orderId);
      setComments((rows || []).map(normalizeComment));
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!onRealtimeRefresh) return undefined;
    const unsub =
      typeof onRealtimeRefresh === "function"
        ? onRealtimeRefresh(() => reload())
        : undefined;
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [onRealtimeRefresh, reload]);

  const sendComment = useCallback(
    async (text) => {
      const content = String(text || "").trim();
      if (!content || !orderId) return false;

      const tempId = `opt-${Date.now()}`;
      const optimistic = {
        id: tempId,
        body: content,
        created_at: new Date().toISOString(),
        author: { name: "You" },
        _optimistic: true,
      };
      setComments((prev) => [optimistic, ...prev]);
      setSending(true);

      try {
        const created = await fleetopsService.createOrderComment(orderId, content);
        const normalized = normalizeComment(created);
        setComments((prev) => [normalized, ...prev.filter((c) => c.id !== tempId)]);
        toast.success("Comment posted");
        return true;
      } catch (err) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        toast.error(parseFleetopsApiError(err));
        return false;
      } finally {
        setSending(false);
      }
    },
    [orderId],
  );

  return { comments, loading, sending, reload, sendComment };
}
