import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { iamService } from "@/services/iam";
import { mapRole, mapUser, statusLabel } from "@/lib/mappers";
import { toast } from "sonner";

export default function UsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [usersResponse, rolesResponse] = await Promise.all([iamService.listUsers(), iamService.listRoles()]);
        if (!active) return;
        setUsers(usersResponse.map(mapUser));
        setRoles(rolesResponse.map(mapRole));
      } catch (err) {
        if (active) {
          toast.error(err?.friendlyMessage || "Failed to load users.");
          setUsers([]);
          setRoles([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-[#EEF0F4] grid place-items-center rounded-sm font-mono font-bold text-xs text-[#0A0E1A]">
            {String(row.name || "")
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div>
            <div className="font-medium text-[#0A0E1A]">{row.name}</div>
            <div className="text-[11px] text-[#4B5563]">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">{row.role}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} label={statusLabel(row.status)} />,
    },
    {
      key: "twoFa",
      header: "2FA",
      render: (row) =>
        row.twoFa ? (
          <span className="inline-flex items-center gap-1 text-xs text-[#15803D] font-mono">
            <ShieldCheck className="h-3 w-3" /> ON
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#4B5563] font-mono">
            <ShieldOff className="h-3 w-3" /> OFF
          </span>
        ),
    },
    {
      key: "lastLogin",
      header: "Last login",
      render: (row) => <span className="font-mono text-xs text-[#374151]">{row.lastLogin}</span>,
    },
  ];

  async function handleInvite(values) {
    const role = roles.find((r) => String(r.id) === String(values.role));
    try {
      const created = await iamService.inviteUser({
        email: values.email,
        name: values.name || undefined,
        role: role?.name,
        role_uuid: role?.id,
        company_role_uuid: role?.id,
      });
      if (created && mapUser(created).id) {
        setUsers((prev) => [mapUser(created), ...prev]);
      }
      return { toast: `Invitation sent to ${values.email}` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to invite user.");
    }
  }

  return (
    <div data-testid="users-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Users" }]}
        overline="Identity & Access"
        title="Users"
        description={loading ? "Loading users…" : `${users.length} users across the organization`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="users-invite-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Invite user
          </Button>
        }
      />
      <div className="p-6">
        {!loading && users.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="users-empty">
            No users returned for this organization.
          </div>
        )}
        <DataTable
          testid="users-table"
          columns={columns}
          data={users}
          searchKeys={["name", "email", "role"]}
          pageSize={10}
          onRowClick={(row) => navigate(`/iam/users/${row.id}`)}
        />
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Invite user"
        description="Send an invitation email. The user will complete onboarding per your Fleetbase settings."
        icon={UserPlus}
        submitLabel="Send invite"
        testid="invite-user-dialog"
        fields={[
          { key: "email", label: "Email", type: "email", required: true },
          { key: "name", label: "Full name", placeholder: "Optional · derived from email if blank", col: "half" },
          {
            key: "role",
            label: "Role",
            type: "select",
            required: true,
            col: "half",
            options: roles.map((role) => ({ value: String(role.id), label: role.name })),
          },
        ]}
        onSubmit={handleInvite}
      />
    </div>
  );
}
