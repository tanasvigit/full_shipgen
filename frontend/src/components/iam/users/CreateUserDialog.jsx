import UserFormDialog from "@/components/iam/users/UserFormDialog";

/** Create user — Ember `user-form` parity (G-IAM043). */
export default function CreateUserDialog({ open, onOpenChange, roles: _roles, onCreated, userType = "user" }) {
  return (
    <UserFormDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      userType={userType}
      onSaved={onCreated}
    />
  );
}
