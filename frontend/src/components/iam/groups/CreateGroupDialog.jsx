import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { iamService } from "@/services/iam";
import { mapGroup } from "@/lib/mappers";
import { UsersRound } from "lucide-react";

export default function CreateGroupDialog({ open, onOpenChange, roles, onCreated }) {
  return (
    <QuickCreateDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create group"
      description="Create a group with a default role for members added to this group."
      icon={UsersRound}
      submitLabel="Create group"
      testid="create-group-dialog"
      fields={[
        { key: "name", label: "Group name", placeholder: "Dispatch team · NYC", required: true },
        {
          key: "defaultRole",
          label: "Default role",
          type: "select",
          required: true,
          options: roles.map((r) => ({ value: String(r.id), label: r.name })),
        },
        { key: "description", label: "Description", type: "textarea", placeholder: "What this group is for." },
      ]}
      onSubmit={async (values) => {
        const role = roles.find((r) => String(r.id) === String(values.defaultRole));
        const created = await iamService.createGroup({
          name: values.name,
          description: values.description || undefined,
          users: [],
          role_uuid: role?.id,
          role: role?.id,
        });
        onCreated?.(mapGroup(created));
        return { toast: `Group "${values.name}" created` };
      }}
    />
  );
}
