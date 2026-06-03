import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useIamAbility } from "@/hooks/iam/useIamAbility";

export default function PolicyListItemActions({ policy, onEdit, onViewPermissions, onDelete }) {
  const ability = useIamAbility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => e.stopPropagation()}
          data-testid={`policy-actions-${policy.id}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {ability.canViewPolicy && !policy.isMutable && (
          <DropdownMenuItem onClick={() => onViewPermissions?.(policy)}>
            <Eye className="h-3.5 w-3.5 mr-2" /> View permissions
          </DropdownMenuItem>
        )}
        {ability.canUpdatePolicy && policy.isMutable && (
          <DropdownMenuItem onClick={() => onEdit?.(policy)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit policy
          </DropdownMenuItem>
        )}
        {ability.canDeletePolicy && policy.isDeletable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(policy)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete policy
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
