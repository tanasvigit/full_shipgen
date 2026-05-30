import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit3, MoreHorizontal, Copy, Archive, Trash2, Download, UserPlus } from "lucide-react";

/**
 * Standard detail drawer header — title block + operational actions.
 */
export default function DetailDrawerHeader({
  overline,
  title,
  publicId,
  status,
  statusLabel: statusLabelText,
  healthIssues = [],
  lastUpdated,
  syncState = "synced",
  onEdit,
  editTestId = "detail-edit",
  actions = [],
  extraActions,
  badges,
}) {
  const blocking = healthIssues.filter((i) => i.level === "blocking").length;

  return (
    <div className="px-4 py-4 pr-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {overline && (
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#4B5563] mb-1">
              {overline}
            </div>
          )}
          <h2 className="font-display text-xl font-bold tracking-tight text-[#0A0E1A] truncate">{title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {publicId && (
              <span className="text-xs font-mono text-[#4B5563]" data-testid="detail-public-id">
                {publicId}
              </span>
            )}
            {status && <StatusBadge status={status} label={statusLabelText || status} />}
            {badges}
            {blocking > 0 && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-700 border border-red-500/20">
                {blocking} compliance
              </span>
            )}
            <span
              className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                syncState === "synced"
                  ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-800 border-amber-500/20"
              }`}
              data-testid="detail-sync-state"
            >
              {syncState}
            </span>
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-[#4B5563] mt-1.5 font-mono">Updated {lastUpdated}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.();
              }}
              className="bg-[#0066FF] hover:bg-[#0040CC] h-9"
              data-testid={editTestId}
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={action.variant || "outline"}
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-9 bg-transparent border-black/[0.08]"
              data-testid={action.testId}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 bg-transparent border-black/[0.08]"
                data-testid="detail-more-menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserPlus className="h-4 w-4 mr-2" /> Assign
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="h-4 w-4 mr-2" /> Export
              </DropdownMenuItem>
              {extraActions}
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Archive className="h-4 w-4 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
