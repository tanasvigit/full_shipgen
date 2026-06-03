import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import UsersListTabs from "@/components/iam/users/UsersListTabs";
import InviteUserDialog from "@/components/iam/users/InviteUserDialog";
import CreateUserDialog from "@/components/iam/users/CreateUserDialog";
import ChangeUserPasswordDialog from "@/components/iam/users/ChangeUserPasswordDialog";
import UserRowActions from "@/components/iam/users/UserRowActions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { iamService } from "@/services/iam";
import { mapRole, statusLabel } from "@/lib/mappers";
import { useIamListPage } from "@/hooks/iam/useIamListPage";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { usersSortFromTable } from "@/lib/iam/usersListQuery";
import { toast } from "sonner";

function listKindFromPath(pathname) {
  if (pathname.includes("/iam/users/drivers")) return "drivers";
  if (pathname.includes("/iam/users/customers")) return "customers";
  return "all";
}

const LIST_COPY = {
  all: { title: "Users", description: "Organization members and access" },
  drivers: { title: "Driver accounts", description: "Users with driver type — FleetOps driver login" },
  customers: { title: "Customer accounts", description: "Users with customer type" },
};

export default function UsersList() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const listKind = listKindFromPath(pathname);
  const copy = LIST_COPY[listKind];
  const ability = useIamAbility();

  const { queryState, patchQuery, users, loading, meta, reload } = useIamListPage({ listKind });
  const [roles, setRoles] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const searchDebounceRef = useRef(null);
  const [searchDraft, setSearchDraft] = useState(queryState.query);

  useEffect(() => {
    setSearchDraft(queryState.query);
  }, [queryState.query]);

  useEffect(() => {
    iamService
      .listRoles()
      .then((rows) => setRoles(rows.map(mapRole)))
      .catch(() => setRoles([]));
  }, []);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchDraft(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        patchQuery({ query: value, page: 1 });
      }, 250);
    },
    [patchQuery],
  );

  const handleSortChange = useCallback(
    (columnKey, direction) => {
      patchQuery({ sort: usersSortFromTable(columnKey, direction), page: 1 });
    },
    [patchQuery],
  );

  const handleBulkDelete = async () => {
    const ids = [...selectedKeys];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected user(s)?`)) return;
    setBulkBusy(true);
    try {
      await iamService.bulkDeleteUsers(ids);
      toast.success(`Deleted ${ids.length} user(s).`);
      setSelectedKeys(new Set());
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Bulk delete failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const selections = selectedKeys.size ? [...selectedKeys] : users.map((u) => u.id);
      await iamService.exportUsers({ selections });
      toast.success("Export started.");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed.");
    }
  };

  const columns = useMemo(
    () => [
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
        key: "phone",
        header: "Phone",
        sortable: true,
        render: (row) => <span className="font-mono text-xs text-[#374151]">{row.phone || "—"}</span>,
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
            {row.role}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => (
          <StatusBadge status={row.sessionStatus || row.status} label={statusLabel(row.sessionStatus || row.status)} />
        ),
      },
      {
        key: "lastLogin",
        header: "Last login",
        render: (row) => <span className="font-mono text-xs text-[#374151]">{row.lastLogin}</span>,
      },
      {
        key: "actions",
        header: "",
        width: 48,
        className: "text-right",
        render: (row) => (
          <UserRowActions user={row} onRefresh={reload} onChangePassword={setPasswordUser} />
        ),
      },
    ],
    [reload],
  );

  const toolbarRight = (
    <>
      <Button variant="outline" size="sm" onClick={() => reload()} className="h-9" data-testid="users-refresh">
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
      {ability.canExportUser && (
        <Button variant="outline" size="sm" onClick={handleExport} className="h-9" data-testid="users-export">
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
      )}
      {ability.canDeleteUser && selectedKeys.size > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDelete}
          disabled={bulkBusy}
          className="h-9 text-red-600 border-red-200"
          data-testid="users-bulk-delete"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ({selectedKeys.size})
        </Button>
      )}
      {ability.canCreateUser && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="h-9"
            data-testid="users-invite-button"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1" /> Invite
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 bg-[#0066FF] hover:bg-[#0040CC] text-white"
            data-testid="users-create-button"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New user
          </Button>
        </>
      )}
    </>
  );

  const filterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={queryState.status || "all"}
        onValueChange={(v) => patchQuery({ status: v === "all" ? "" : v, page: 1 })}
      >
        <SelectTrigger className="h-9 w-[130px] text-xs" data-testid="users-filter-status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={queryState.role || "all"}
        onValueChange={(v) => patchQuery({ role: v === "all" ? "" : v, page: 1 })}
      >
        <SelectTrigger className="h-9 w-[160px] text-xs" data-testid="users-filter-role">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div data-testid="users-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: copy.title }]}
        overline="Identity & Access"
        title={copy.title}
        description={loading ? "Loading users…" : `${meta.total} users`}
        actions={toolbarRight}
      />
      <div className="px-6">
        <UsersListTabs />
        {filterToolbar}
      </div>
      <div className="p-6 pt-0">
        {!loading && users.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="users-empty">
            No users returned for this organization.
          </div>
        )}
        <DataTable
          testid="users-table"
          columns={columns}
          data={users}
          loading={loading}
          searchKeys={["name", "email", "phone", "role"]}
          searchValue={searchDraft}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          selectable={ability.canDeleteUser}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          serverPagination={{
            page: meta.page,
            lastPage: meta.lastPage,
            total: meta.total,
            onPageChange: (p) => patchQuery({ page: p }),
          }}
          toolbarLeft={null}
          onRowClick={
            passwordUser
              ? undefined
              : (row) => navigate(`/iam/users/${row.id}`)
          }
        />
      </div>

      <ChangeUserPasswordDialog
        open={Boolean(passwordUser)}
        onOpenChange={(open) => {
          if (!open) setPasswordUser(null);
        }}
        user={passwordUser}
        onSuccess={reload}
      />
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles} onInvited={() => reload()} />
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        userType={listKind === "drivers" ? "driver" : listKind === "customers" ? "customer" : "user"}
        onCreated={() => reload()}
      />
    </div>
  );
}
