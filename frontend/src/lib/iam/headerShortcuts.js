import { UserCog, IdCard, Users, UsersRound, KeyRound, FileKey } from "lucide-react";

/** Ember `iam-engine` extension.js header shortcuts (G-IAM035). */
export const IAM_HEADER_SHORTCUTS = [
  { to: "/iam/users", label: "Users", icon: UserCog, testId: "iam-shortcut-users", permission: "users.view" },
  { to: "/iam/users/drivers", label: "Drivers", icon: IdCard, testId: "iam-shortcut-drivers", permission: "users.view" },
  { to: "/iam/users/customers", label: "Customers", icon: Users, testId: "iam-shortcut-customers", permission: "users.view" },
  { to: "/iam/groups", label: "Groups", icon: UsersRound, testId: "iam-shortcut-groups", permission: "groups.view" },
  { to: "/iam/roles", label: "Roles", icon: KeyRound, testId: "iam-shortcut-roles", permission: "roles.view" },
  { to: "/iam/policies", label: "Policies", icon: FileKey, testId: "iam-shortcut-policies", permission: "policies.view" },
];
