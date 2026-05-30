import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Check, Sparkles, ShieldCheck, Blocks, Loader2 } from "lucide-react";
import { registryService } from "@/services/registry";
import { mapRegistryExtension } from "@/lib/mappers";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = ["All", "FleetOps", "Storefront", "Ledger", "Notifications", "Developers"];

export default function RegistryHome() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [extensions, setExtensions] = useState([]);
  const [installedIds, setInstalledIds] = useState(new Set());
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [extRaw, installedRaw, catRaw] = await Promise.all([
        registryService.listExtensions({ limit: 200, sort: "-installs_count" }),
        registryService.listInstalled(),
        registryService.listCategories().catch(() => []),
      ]);

      const installedSet = new Set(
        (installedRaw || []).map((x) => x?.public_id || x?.uuid || x?.id).filter(Boolean),
      );
      setInstalledIds(installedSet);

      setExtensions(
        (extRaw || []).map((x) => {
          const id = x?.public_id || x?.uuid || x?.id;
          return mapRegistryExtension(x, { installed: installedSet.has(id) });
        }),
      );

      const catNames = (catRaw || [])
        .map((c) => (typeof c === "string" ? c : c?.name))
        .filter(Boolean);
      if (catNames.length) {
        setCategories(["All", ...catNames.filter((n) => n !== "All")]);
      }
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load extension registry.");
      setExtensions([]);
      setInstalledIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return extensions.filter((e) => {
      if (cat !== "All" && e.category !== cat) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!e.name.toLowerCase().includes(needle) && !e.description.toLowerCase().includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [extensions, cat, q]);

  async function toggleInstall(e) {
    const id = e.publicId || e.id;
    setActionId(id);
    try {
      if (e.installed) {
        await registryService.uninstallExtension(id);
        toast.success(`${e.name} uninstalled`);
      } else {
        await registryService.installExtension(id);
        toast.success(`${e.name} installed`);
      }
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Install action failed.");
    } finally {
      setActionId(null);
    }
  }

  async function handlePublish(v) {
    setSubmitting(true);
    try {
      const created = await registryService.createExtension({
        registry_extension: {
          name: v.name.trim(),
          description: (v.description || "").trim(),
          promotional_text: (v.description || "").trim(),
        },
      });
      const id = created?.public_id || created?.uuid || created?.id;
      if (id) {
        try {
          await registryService.submitExtension(id);
        } catch {
          /* submit may require additional fields — extension still created */
        }
      }
      await load();
      return { toast: `Extension "${v.name}" submitted for review` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to publish extension.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="registry-page">
      <PageHeader
        breadcrumbs={[{ label: "Registry" }, { label: "Marketplace" }]}
        overline="Marketplace"
        title="Extensions"
        description={
          loading
            ? "Loading extensions…"
            : `${extensions.length} extensions · ${installedIds.size} installed`
        }
        actions={
          <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="registry-publish">
            Publish your extension
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" strokeWidth={1.75} />
            <Input
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Search extensions…"
              className="pl-8 h-9 bg-[#F1F2F5] border-black/[0.08] text-sm"
              data-testid="registry-search"
            />
          </div>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              data-testid={`registry-cat-${c.toLowerCase()}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                cat === c ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-[#4B5563] py-16 text-center">Loading marketplace…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[#4B5563] py-16 text-center">
            {extensions.length === 0
              ? "No extensions available. Check registry bridge configuration and permissions."
              : "No extensions match your search."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((e) => {
              const busy = actionId === (e.publicId || e.id);
              return (
                <div
                  key={e.id}
                  className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors flex flex-col"
                  data-testid={`extension-${e.id}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="h-12 w-12 grid place-items-center rounded-md shrink-0 overflow-hidden"
                      style={{ background: `${e.color}22`, border: `1px solid ${e.color}55` }}
                    >
                      {e.iconUrl ? (
                        <img src={e.iconUrl} alt="" className="h-8 w-8 object-contain" />
                      ) : (
                        <Blocks className="h-5 w-5" style={{ color: e.color }} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="font-display font-bold tracking-tight truncate">{e.name}</div>
                        {e.verified && <ShieldCheck className="h-3.5 w-3.5 text-[#0066FF] shrink-0" />}
                      </div>
                      <div className="text-[11px] text-[#4B5563] truncate">
                        {e.author} · {e.category}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#374151] flex-1 line-clamp-3">{e.description}</p>
                  <div className="flex items-center gap-3 mt-4 text-[11px] font-mono uppercase tracking-wider text-[#4B5563]">
                    {e.rating != null && (
                      <span className="inline-flex items-center gap-1 text-[#A16207]">
                        <Star className="h-3 w-3 fill-amber-400" /> {e.rating.toFixed(1)}
                      </span>
                    )}
                    <span>{e.installs.toLocaleString()} installs</span>
                    <span className="ml-auto text-[#0A0E1A]">{e.price}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-black/[0.08]">
                    <Button
                      onClick={() => toggleInstall(e)}
                      disabled={busy}
                      data-testid={`extension-install-${e.id}`}
                      className={`w-full h-9 ${e.installed ? "bg-[#F1F2F5] hover:bg-[#EEF0F4] text-[#1F2937] border border-black/[0.08]" : "bg-blue-600 hover:bg-blue-700"}`}
                      variant={e.installed ? "outline" : "default"}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : e.installed ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Installed
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Install
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Publish extension"
        description="Submit your extension to the Fleetbase registry (requires registry publish permissions)."
        icon={Blocks}
        submitLabel={submitting ? "Submitting…" : "Publish"}
        testid="publish-extension-dialog"
        fields={[
          { key: "name", label: "Extension name", placeholder: "Advanced Route Optimizer", required: true },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: categories.filter((c) => c !== "All").map((c) => ({ value: c, label: c })),
          },
          { key: "author", label: "Author (display only)", placeholder: "Set on developer account", col: "half" },
          { key: "price", label: "Price hint", placeholder: "Set in registry after create", col: "half" },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            rows: 3,
            required: true,
            placeholder: "Short pitch — what the extension does (min. 12 characters).",
          },
        ]}
        onSubmit={handlePublish}
      />
    </div>
  );
}
