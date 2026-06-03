import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useIamAbility } from "@/hooks/iam/useIamAbility";
import { iamService } from "@/services/iam";
import { toast } from "sonner";
import UserPermissionsDialog from "@/components/iam/users/UserPermissionsDialog";
import { mapUser } from "@/lib/mappers";

export default function UserRowActions({ user, onRefresh, onPermissionsLoad, onChangePassword }) {
  const navigate = useNavigate();
  const ability = useIamAbility();
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);

  const sessionStatus = user.sessionStatus || user.status;

  const confirmAction = async (message, action) => {
    if (!window.confirm(message)) return;
    try {
      await action();
      toast.success("Done");
      onRefresh?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Action failed.");
    }
  };

  const viewPermissions = async () => {
    try {
      const full = await iamService.getUser(user.id);
      const mapped = mapUser(full);
      setPermissionsUser(mapped);
      onPermissionsLoad?.(mapped);
      setPermissionsOpen(true);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load permissions.");
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
            data-testid={`user-row-actions-${user.id}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
          {ability.canViewUser && (
            <DropdownMenuItem onClick={() => navigate(`/iam/users/${user.id}`)}>Edit user</DropdownMenuItem>
          )}
          {ability.canViewUser && (
            <DropdownMenuItem onClick={viewPermissions}>View permissions</DropdownMenuItem>
          )}
          {ability.canUpdateUser && sessionStatus === "pending" && (
            <DropdownMenuItem
              onClick={() =>
                confirmAction(`Resend invitation to ${user.name}?`, () => iamService.resendInvite(user.id))
              }
            >
              Resend invitation
            </DropdownMenuItem>
          )}
          {ability.canDeactivateUser && sessionStatus === "active" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  confirmAction(`Deactivate ${user.name}?`, () => iamService.deactivateUser(user.id))
                }
              >
                Deactivate
              </DropdownMenuItem>
            </>
          )}
          {ability.canActivateUser && (sessionStatus === "inactive" || sessionStatus === "pending") && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => confirmAction(`Activate ${user.name}?`, () => iamService.activateUser(user.id))}
            >
              Activate
            </DropdownMenuItem>
          )}
          {ability.canVerifyUser && !user.emailVerified && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => confirmAction(`Verify ${user.name}?`, () => iamService.verifyUser(user.id))}
            >
              Verify email
            </DropdownMenuItem>
          )}
          {ability.canChangePasswordForUser && (
            <DropdownMenuItem
              data-testid="user-row-change-password"
              onSelect={(e) => {
                e.preventDefault();
                onChangePassword?.(user);
              }}
            >
              Change password
            </DropdownMenuItem>
          )}
          {ability.canDeleteUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  confirmAction(`Remove ${user.name} from this organization?`, () =>
                    iamService.removeFromCompany(user.id),
                  )
                }
              >
                Remove from company
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserPermissionsDialog open={permissionsOpen} onOpenChange={setPermissionsOpen} user={permissionsUser} />
    </div>
  );
}
