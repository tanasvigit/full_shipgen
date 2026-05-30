import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, UserPlus } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapStoreCustomer, statusLabelExt } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await storefrontService.listCustomers({ limit: 500 });
      setCustomers((raw || []).map(mapStoreCustomer));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load customers.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-[#EEF0F4] grid place-items-center rounded-sm font-mono font-bold text-xs text-[#0A0E1A]">
            {String(r.name || "")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <div className="font-medium text-[#0A0E1A]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{r.publicId}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      render: (r) => (
        <div className="text-xs font-mono text-[#374151] space-y-0.5">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" /> {r.email || "—"}
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" /> {r.phone}
          </div>
        </div>
      ),
    },
    { key: "status", header: "Tier", render: (r) => <StatusBadge status={r.status} label={statusLabelExt(r.status)} /> },
    { key: "orders", header: "Orders", sortable: true, render: (r) => <span className="font-mono tabular text-sm">{r.orders}</span> },
    {
      key: "ltv",
      header: "LTV",
      sortable: true,
      render: (r) => <span className="font-mono tabular text-sm">{r.ltv > 0 ? formatMoney(r.ltv) : "—"}</span>,
    },
    {
      key: "lastOrder",
      header: "Last order",
      render: (r) => (
        <span className="font-mono text-xs text-[#374151]">
          {r.lastOrder === "—" ? "—" : formatRelativeApiTime(r.lastOrder)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (r) => (
        <span className="font-mono text-xs text-[#4B5563]">
          {r.joined === "—" ? "—" : formatRelativeApiTime(r.joined)}
        </span>
      ),
    },
  ];

  async function handleCreate(v) {
    try {
      const created = await storefrontService.createCustomer({
        name: v.name,
        email: v.email,
        phone: v.phone || undefined,
        meta: v.tier ? { tier: v.tier } : undefined,
      });
      const mapped = mapStoreCustomer(created);
      setCustomers((p) => [mapped, ...p.filter((c) => String(c.id) !== String(mapped.id))]);
      return { toast: `Customer ${v.name} added` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create customer.");
    }
  }

  return (
    <div data-testid="customers-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Customers" }]}
        overline="Audience"
        title="Customers"
        description={loading ? "Loading…" : `${customers.length} customers`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="customers-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add customer
          </Button>
        }
      />
      <div className="p-6">
        {!loading && customers.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="customers-empty">
            No customers returned for this organization.
          </div>
        )}
        <DataTable
          testid="customers-table"
          columns={columns}
          data={customers}
          searchKeys={["name", "email", "publicId"]}
          pageSize={10}
          onRowClick={(r) => navigate(`/storefront/customers/${r.id}`)}
        />
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Add customer"
        description="Create a storefront customer (contact) record."
        icon={UserPlus}
        submitLabel="Add customer"
        testid="add-customer-dialog"
        fields={[
          { key: "name", label: "Full name", placeholder: "Jane Doe", required: true },
          { key: "email", label: "Email", type: "email", required: true, col: "half" },
          { key: "phone", label: "Phone", placeholder: "+1 555 0100", col: "half" },
          {
            key: "tier",
            label: "Tier (meta)",
            type: "select",
            options: [
              { value: "new", label: "New" },
              { value: "active", label: "Active" },
              { value: "vip", label: "VIP" },
            ],
          },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
