import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Copy, Eye, EyeOff, RotateCw, Ban, KeyRound } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapApiCredential } from "@/lib/mappers";
import { maskSecret } from "@/lib/maskSecret";
import { toast } from "sonner";

function extractPlainKey(entity) {
  if (!entity || typeof entity !== "object") return null;
  return entity.key || entity.token || entity.secret || entity.api_key || null;
}

export default function ApiKeysList() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});
  /** id -> plaintext shown only after create or roll when API returns it once */
  const [plaintextById, setPlaintextById] = useState({});
  const [newKeyOpen, setNewKeyOpen] = useState(false);
  const [onceSecret, setOnceSecret] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await developersService.listApiCredentials();
      setKeys(raw.map(mapApiCredential));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load API keys.");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggleReveal(id) {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  }

  function copy(value) {
    try {
      navigator.clipboard?.writeText(value)?.catch?.(() => {});
    } catch {
      /* ignore */
    }
    toast.success("Copied to clipboard");
  }

  function displayKey(row) {
    const plain = plaintextById[row.id];
    const source = plain || row.publicId;
    return revealed[row.id] ? String(source) : maskSecret(source);
  }

  async function handleRotate(id) {
    try {
      const rolled = await developersService.rollApiCredential(id);
      const plain = extractPlainKey(rolled);
      const mapped = mapApiCredential(rolled);
      if (plain) setPlaintextById((p) => ({ ...p, [mapped.id]: plain }));
      setKeys((ks) => ks.map((k) => (String(k.id) === String(mapped.id) ? mapped : k)));
      setRevealed((r) => ({ ...r, [mapped.id]: Boolean(plain) }));
      if (plain) setOnceSecret(plain);
      toast.success("Key rotated · previous key is invalid");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to rotate key.");
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this API key? Applications using it will fail immediately.")) return;
    try {
      await developersService.deleteApiCredential(id);
      setPlaintextById((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      await reload();
      toast.success("Key revoked");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to revoke key.");
    }
  }

  async function handleCreate(values) {
    const name = String(values.name || "").trim();
    if (!name) throw new Error("Name is required");
    const testMode = values.mode === "test";
    try {
      const created = await developersService.createApiCredential({
        name,
        test_mode: testMode,
      });
      const plain = extractPlainKey(created);
      const mapped = mapApiCredential(created);
      if (plain) {
        setPlaintextById((p) => ({ ...p, [mapped.id]: plain }));
        setOnceSecret(plain);
      }
      setKeys((ks) => [mapped, ...ks.filter((k) => String(k.id) !== String(mapped.id))]);
      setRevealed((r) => ({ ...r, [mapped.id]: Boolean(plain) }));
      return { toast: plain ? "API key created · copy the secret from the dialog" : "API key created" };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create API key.");
    }
  }

  const activeCount = keys.filter((k) => k.status === "active").length;

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm">
            <KeyRound className="h-3.5 w-3.5 text-[#0066FF]" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-medium text-[#0A0E1A]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{r.scope}</div>
          </div>
        </div>
      ),
    },
    {
      key: "publicId",
      header: "Key",
      render: (r) => (
        <div className="flex items-center gap-1.5 max-w-[420px]">
          <code className="font-mono text-[11px] text-[#1F2937] bg-[#F1F2F5] border border-black/[0.08] px-2 py-1 rounded-sm truncate min-w-0">
            {displayKey(r)}
          </code>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleReveal(r.id);
            }}
            className="h-6 w-6 grid place-items-center text-[#4B5563] hover:text-[#0A0E1A] shrink-0"
            data-testid={`key-toggle-${r.id}`}
          >
            {revealed[r.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copy(plaintextById[r.id] || r.publicId);
            }}
            className="h-6 w-6 grid place-items-center text-[#4B5563] hover:text-[#0A0E1A] shrink-0"
            data-testid={`key-copy-${r.id}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: "type",
      header: "Mode",
      render: (r) => (
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
            r.type === "live"
              ? "bg-emerald-500/10 border-emerald-500/20 text-[#15803D]"
              : "bg-amber-500/10 border-amber-500/20 text-[#A16207]"
          }`}
        >
          {r.type}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "calls7d",
      header: "Calls (7d)",
      sortable: true,
      render: (r) => <span className="font-mono text-sm tabular">{r.calls7d.toLocaleString()}</span>,
    },
    {
      key: "lastUsed",
      header: "Last used",
      render: (r) => <span className="font-mono text-xs text-[#374151]">{r.lastUsed}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={r.status === "revoked"}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(r.id);
            }}
            className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] h-7 text-xs"
            data-testid={`key-rotate-${r.id}`}
          >
            <RotateCw className="h-3 w-3 mr-1" /> Rotate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={r.status === "revoked"}
            onClick={(e) => {
              e.stopPropagation();
              handleRevoke(r.id);
            }}
            className="bg-transparent border-red-500/40 text-[#B91C1C] hover:bg-red-500/10 h-7 text-xs"
            data-testid={`key-revoke-${r.id}`}
          >
            <Ban className="h-3 w-3 mr-1" /> Revoke
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div data-testid="api-keys-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Developers", to: "/developers" }, { label: "API Keys" }]}
        overline="Authentication"
        title="API Keys"
        description={
          loading ? "Loading…" : `${activeCount} active · ${keys.length} total`
        }
        actions={
          <Button
            onClick={() => setNewKeyOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="new-api-key-button"
          >
            <Plus className="h-4 w-4 mr-1" /> Generate key
          </Button>
        }
      />
      <div className="p-6">
        {!loading && keys.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="api-keys-empty">
            No API credentials returned for this organization.
          </div>
        )}
        <DataTable
          testid="api-keys-table"
          columns={columns}
          data={keys}
          searchKeys={["name", "publicId", "scope"]}
          pageSize={10}
        />
      </div>

      <QuickCreateDialog
        open={newKeyOpen}
        onOpenChange={setNewKeyOpen}
        title="Generate API key"
        description="Name identifies this credential in the console. Choose sandbox or live mode per backend rules."
        icon={KeyRound}
        submitLabel="Generate key"
        testid="new-api-key-dialog"
        fields={[
          { key: "name", label: "Name", placeholder: "Production server", required: true },
          {
            key: "mode",
            label: "Mode",
            type: "select",
            required: true,
            options: [
              { value: "live", label: "Live" },
              { value: "test", label: "Sandbox / test" },
            ],
            defaultValue: "live",
          },
        ]}
        onSubmit={handleCreate}
      />

      <Dialog open={Boolean(onceSecret)} onOpenChange={(open) => !open && setOnceSecret(null)}>
        <DialogContent className="bg-white border-black/[0.08] max-w-lg" data-testid="api-key-secret-once-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-black tracking-tighter">Save your secret</DialogTitle>
            <DialogDescription className="text-xs text-[#4B5563]">
              This value is shown only once. Store it in a secret manager or environment variable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-3 text-xs text-[#A16207]">
              Do not share this key or commit it to source control.
            </div>
            <code className="block font-mono text-[11px] break-all text-[#1F2937] bg-[#F1F2F5] border border-black/[0.08] p-3 rounded-sm">
              {onceSecret}
            </code>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                copy(onceSecret);
                setOnceSecret(null);
              }}
              data-testid="api-key-secret-copy-dismiss"
            >
              Copy and close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
