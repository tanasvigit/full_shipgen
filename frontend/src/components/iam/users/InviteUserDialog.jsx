import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { iamService } from "@/services/iam";
import { UserPlus } from "lucide-react";

export default function InviteUserDialog({ open, onOpenChange, roles, onInvited }) {
  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite user"
      description="Send an invitation email. Existing users receive a cross-organization invite."
      icon={UserPlus}
      submitLabel="Send invite"
      testid="invite-user-dialog"
      fields={[
        { key: "email", label: "Email", type: "email", required: true },
        { key: "name", label: "Full name", placeholder: "Optional", col: "half" },
        {
          key: "role",
          label: "Role",
          type: "select",
          required: true,
          col: "half",
          options: roles.map((role) => ({ value: String(role.id), label: role.name })),
        },
      ]}
      onSubmit={async (values) => {
        const role = roles.find((r) => String(r.id) === String(values.role));
        const response = await iamService.inviteUser({
          email: values.email,
          name: values.name || values.email.split("@")[0],
          role_uuid: role?.id,
        });
        onInvited?.(response);
        const existing = response?.invited === true;
        return {
          toast: existing
            ? `Invitation sent to existing user ${values.email}`
            : `Invitation sent to ${values.email}`,
        };
      }}
    />
  );
}
