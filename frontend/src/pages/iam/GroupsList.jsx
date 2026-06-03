import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import CreateGroupDialog from "@/components/iam/groups/CreateGroupDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Plus, RefreshCw, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { iamService } from "@/services/iam";
import { mapRole } from "@/lib/mappers";
import { useGroupsListPage } from "@/hooks/iam/useGroupsListPage";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function GroupsList() {
  const navigate = useNavigate();
  const ability = useIamAbility();
  const { queryState, patchQuery, groups, loading, meta, reload } = useGroupsListPage();
  const [roles, setRoles] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchDraft, setSearchDraft] = useState(queryState.query);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    setSearchDraft(queryState.query);
  }, [queryState.query]);

  useEffect(() => {
    iamService
      .listRoles({ limit: 100 })
      .then((rows) => setRoles(rows.map(mapRole)))
      .catch(() => setRoles([]));
  }, []);

  const handleSearchChange = useCallback(
    (value) => {
      setSearchDraft(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => patchQuery({ query: value, page: 1 }), 250);
    },
    [patchQuery],
  );

  async function handleExport() {
    try {
      await iamService.exportGroups({ selections: [...selectedKeys] });
      toast.success("Export started");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed.");
    }
  }

  async function handleBulkDelete() {
    if (!selectedKeys.size) return;
    if (!window.confirm(`Delete ${selectedKeys.size} group(s)?`)) return;
    setBulkBusy(true);
    try {
      await iamService.bulkDeleteGroups([...selectedKeys]);
      toast.success("Groups deleted");
      setSelectedKeys(new Set());
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Bulk delete failed.");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleDelete(group) {
    if (!group.isDeletable) {
      toast.warning("This group cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete group "${group.name}"?`)) return;
    try {
      await iamService.deleteGroup(group.id);
      toast.success("Group deleted");
      reload();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not delete group.");
    }
  }

  const columns = [
    {
      key: "name",
      header: "Group",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-[#0066FF]/10 border border-[#0066FF]/25 grid place-items-center rounded-sm">
            <UsersRound className="h-4 w-4 text-[#0066FF]" />
          </div>
          <div>
            <div className="font-medium text-[#0A0E1A]">{row.name}</div>
            <div className="text-[11px] text-[#4B5563] line-clamp-1">{row.description || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      render: (row) => <span className="font-mono text-xs">{row.memberCount}</span>,
    },
    {
      key: "defaultRoleName",
      header: "Default role",
      render: (row) => (
        <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
          {row.defaultRoleName || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: 48,
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
              data-testid={`group-row-actions-${row.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {ability.canViewGroup && (
              <DropdownMenuItem onClick={() => navigate(`/iam/groups/${row.id}`)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                {ability.canUpdateGroup ? "Open / edit" : "View group"}
              </DropdownMenuItem>
            )}
            {ability.canDeleteGroup && row.isDeletable && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(row)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div data-testid="groups-list-page">
      <PageHeader
        breadcrumbs={[{ label: "IAM", to: "/iam" }, { label: "Groups" }]}
        overline="Identity & Access"
        title="Groups"
        description={loading ? "Loading groups…" : `${meta.total} groups for batch membership`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => reload()} className="h-9" data-testid="groups-refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {ability.canUpdateGroup && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9" data-testid="groups-export">
                <Download className="h-3.5 w-3.5 mr-1" /> Export
              </Button>
            )}
            {ability.canDeleteGroup && selectedKeys.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkBusy}
                className="h-9 text-red-600 border-red-200"
                data-testid="groups-bulk-delete"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ({selectedKeys.size})
              </Button>
            )}
            {ability.canCreateGroup && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg"
                data-testid="groups-new-button"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Create group
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 pt-0">
        <div className="relative w-full max-w-xs mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" />
          <Input
            value={searchDraft}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search groups…"
            className="pl-9 h-9 text-sm"
            data-testid="groups-search"
          />
        </div>

        {!loading && groups.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="groups-empty">
            No groups returned for this organization.
          </div>
        )}

        <DataTable
          testid="groups-table"
          columns={columns}
          data={groups}
          loading={loading}
          selectable={ability.canDeleteGroup}
          selectedKeys={selectedKeys}
          onSelectedKeysChange={setSelectedKeys}
          searchKeys={[]}
          serverPagination={{
            page: meta.page,
            lastPage: meta.lastPage,
            total: meta.total,
            onPageChange: (p) => patchQuery({ page: p }),
          }}
          onRowClick={(row) => navigate(`/iam/groups/${row.id}`)}
        />
      </div>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onCreated={(row) => {
          reload();
          if (row?.id) navigate(`/iam/groups/${row.id}`);
        }}
      />
    </div>
  );
}
