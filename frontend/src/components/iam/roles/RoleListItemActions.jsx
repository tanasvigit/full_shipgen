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

export default function RoleListItemActions({ role, onEdit, onViewPermissions, onDelete }) {
  const ability = useIamAbility();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => e.stopPropagation()}
          data-testid={`role-actions-${role.id}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {ability.canViewRole && !role.isMutable && (
          <DropdownMenuItem onClick={() => onViewPermissions?.(role)}>
            <Eye className="h-3.5 w-3.5 mr-2" /> View permissions
          </DropdownMenuItem>
        )}
        {ability.canUpdateRole && role.isMutable && (
          <DropdownMenuItem onClick={() => onEdit?.(role)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit role
          </DropdownMenuItem>
        )}
        {ability.canDeleteRole && role.isDeletable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(role)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete role
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
