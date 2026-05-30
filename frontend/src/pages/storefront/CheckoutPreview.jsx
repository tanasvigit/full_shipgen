import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, CreditCard, Truck, Trash2, ShoppingCart, CheckCircle2, Package } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCart, mapProduct } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

export default function CheckoutPreview() {
  const [products, setProducts] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [cart, setCart] = useState(null);
  const [lines, setLines] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [step, setStep] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [cartError, setCartError] = useState(null);
  const syncRef = useRef(0);

  const productLookup = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (p.publicId) map[p.publicId] = p;
    }
    return map;
  }, [products]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await storefrontService.listProducts({ limit: 100, status: "available" });
        if (!alive) return;
        setProducts((raw || []).map(mapProduct).filter((p) => p.isAvailable !== false));
      } catch (err) {
        if (alive) toast.error(err?.friendlyMessage || "Failed to load products for checkout.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initCart = useCallback(async () => {
    try {
      const raw = await storefrontService.retrieveCart();
      const id = raw?.public_id || raw?.id;
      setCartId(id);
      setCart(mapCart(raw, productLookup));
      setCartError(null);
    } catch (err) {
      setCartError(err?.friendlyMessage || "Cart API unavailable. Ensure storefront v1 routes are reachable.");
      setCartId(null);
      setCart(null);
    }
  }, [productLookup]);

  useEffect(() => {
    initCart();
  }, [initCart]);

  const syncCartToServer = useCallback(
    async (nextLines) => {
      if (!cartId) return;
      const token = ++syncRef.current;
      setSyncing(true);
      try {
        await storefrontService.emptyCart(cartId);
        let last = null;
        for (const line of nextLines) {
          if (!line.publicId || line.qty < 1) continue;
          last = await storefrontService.addCartItem(cartId, line.publicId, { quantity: line.qty });
        }
        if (token !== syncRef.current) return;
        const mapped = mapCart(last || (await storefrontService.retrieveCart(cartId)), productLookup);
        setCart(mapped);
        setCartError(null);
      } catch (err) {
        if (token === syncRef.current) {
          setCartError(err?.friendlyMessage || "Failed to sync cart with server.");
        }
      } finally {
        if (token === syncRef.current) setSyncing(false);
      }
    },
    [cartId, productLookup],
  );

  useEffect(() => {
    if (!cartId) return;
    const t = setTimeout(() => syncCartToServer(lines), 400);
    return () => clearTimeout(t);
  }, [lines, cartId, syncCartToServer]);

  function addProduct(publicId) {
    const p = productLookup[publicId];
    if (!p) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.publicId === publicId);
      if (existing) {
        return prev.map((l) => (l.publicId === publicId ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { publicId, qty: 1, name: p.name, sku: p.sku, price: p.price, currency: p.currency, image: p.image }];
    });
  }

  function changeQty(publicId, delta) {
    setLines((prev) =>
      prev
        .map((l) => (l.publicId === publicId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  function removeLine(publicId) {
    setLines((prev) => prev.filter((l) => l.publicId !== publicId));
  }

  const displayLines = cart?.items?.length ? cart.items : lines;
  const currency = cart?.currency || lines[0]?.currency || products[0]?.currency || "USD";
  const subtotal = cart?.subtotal ?? lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <div data-testid="checkout-preview-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Checkout Preview" }]}
        overline="Sales"
        title="Checkout Preview"
        description="Cart totals are calculated by the storefront v1 cart API (same auth and company headers as the console)."
      />
      <div className="p-6">
        {cartError && (
          <div className="mb-4 text-sm text-[#B91C1C] bg-red-500/5 border border-red-500/20 rounded-md p-3" data-testid="checkout-cart-error">
            {cartError}
          </div>
        )}

        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { n: 1, label: "Cart" },
              { n: 2, label: "Shipping & Payment" },
              { n: 3, label: "Confirmation" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 grid place-items-center rounded-sm font-mono font-bold text-xs ${
                    step === s.n
                      ? "bg-blue-600 text-white"
                      : step > s.n
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-[#15803D]"
                        : "bg-[#F1F2F5] border border-black/[0.08] text-[#4B5563]"
                  }`}
                >
                  {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
                </div>
                <span className={`text-xs font-mono uppercase tracking-wider ${step === s.n ? "text-[#0A0E1A]" : "text-[#4B5563]"}`}>
                  {s.label}
                </span>
                {s.n < 3 && <div className="w-12 h-px bg-[#EEF0F4] mx-2" />}
              </div>
            ))}
          </div>
        )}

        {step === 3 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="mx-auto h-16 w-16 grid place-items-center bg-emerald-500/10 border border-emerald-500/30 rounded-md mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#15803D]" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-3xl font-black tracking-tighter">Preview complete</h2>
            <p className="text-sm text-[#374151] mt-2">
              Cart subtotal {formatMoney(subtotal, currency)} · capture via storefront/v1/checkouts in production apps.
            </p>
            <Button
              onClick={() => {
                setStep(1);
                setLines([]);
                setCoupon("");
                initCart();
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700"
              data-testid="checkout-reset"
            >
              Reset preview
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-black/[0.08] overline flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3" /> Cart · {displayLines.reduce((s, i) => s + (i.qty || 0), 0)} items
                    {syncing && <span className="text-[10px] text-[#4B5563] ml-2">Syncing…</span>}
                  </div>
                  {displayLines.length === 0 ? (
                    <div className="p-12 text-center text-sm text-[#4B5563]">Add products below to build a cart.</div>
                  ) : (
                    <div className="divide-y divide-black/[0.06]">
                      {displayLines.map((i) => (
                        <div key={i.id || i.productId} className="flex items-center gap-3 p-3" data-testid={`cart-${i.productId || i.publicId}`}>
                          {i.image ? (
                            <img src={i.image} alt="" className="h-14 w-14 object-cover rounded-sm border border-black/[0.08]" />
                          ) : (
                            <div className="h-14 w-14 bg-[#F1F2F5] border border-black/[0.08] rounded-sm grid place-items-center">
                              <Package className="h-5 w-5 text-[#4B5563]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{i.name}</div>
                            <div className="text-[10px] font-mono text-[#4B5563]">
                              {i.sku} · {formatMoney(i.price, currency)} each
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => changeQty(i.productId || i.publicId, -1)}
                              className="h-7 w-7 grid place-items-center bg-[#F1F2F5] border border-black/[0.08] rounded-sm hover:bg-[#EEF0F4]"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm tabular">{i.qty}</span>
                            <button
                              type="button"
                              onClick={() => changeQty(i.productId || i.publicId, 1)}
                              className="h-7 w-7 grid place-items-center bg-[#F1F2F5] border border-black/[0.08] rounded-sm hover:bg-[#EEF0F4]"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="w-20 text-right font-mono tabular text-sm">
                            {formatMoney((i.subtotal ?? i.price * i.qty), currency)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(i.productId || i.publicId)}
                            className="h-7 w-7 grid place-items-center text-[#4B5563] hover:text-[#B91C1C]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-black/[0.08] rounded-md p-4">
                  <div className="overline mb-2">Add product</div>
                  <div className="flex flex-wrap gap-2">
                    {products.slice(0, 12).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p.publicId)}
                        className="text-xs px-2 py-1 border border-black/[0.08] rounded-sm hover:bg-[#F1F2F5] font-mono"
                        data-testid={`add-product-${p.publicId}`}
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
                <div className="overline flex items-center gap-2">
                  <Truck className="h-3 w-3" /> Shipping (preview only)
                </div>
                <p className="text-sm text-[#4B5563]">
                  Address fields are not submitted in this console preview. Production checkout uses storefront/v1/checkouts with a service quote.
                </p>
                <div className="overline flex items-center gap-2 pt-3 border-t border-black/[0.08]">
                  <CreditCard className="h-3 w-3" /> Payment (preview only)
                </div>
              </div>
            )}

            <aside className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4 h-fit">
              <div className="overline">Order summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#374151]">Subtotal (API)</span>
                  <span className="font-mono tabular">{formatMoney(subtotal, currency)}</span>
                </div>
                <p className="text-[11px] text-[#4B5563]">
                  Tax, shipping, and discounts are calculated by checkout/service-quote endpoints when a full storefront session is configured.
                </p>
                <div className="flex justify-between font-display font-bold pt-2 border-t border-black/[0.08] text-lg">
                  <span>Total preview</span>
                  <span className="font-mono tabular">{formatMoney(subtotal, currency)}</span>
                </div>
              </div>
              {step === 1 && (
                <div className="pt-3 border-t border-black/[0.08] space-y-2">
                  <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">Discount code (cart field)</Label>
                  <Input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Set on cart in production"
                    className="bg-[#F1F2F5] border-black/[0.08] font-mono text-sm"
                    data-testid="coupon-input"
                  />
                  <p className="text-[10px] text-[#4B5563]">
                    Applying codes requires cart update support on your deployment; not simulated here.
                  </p>
                </div>
              )}
              <Button
                disabled={displayLines.length === 0 || syncing || Boolean(cartError)}
                onClick={() => setStep(step + 1)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                data-testid="checkout-next"
              >
                {step === 1 ? "Continue to shipping" : "Complete preview"}
              </Button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
