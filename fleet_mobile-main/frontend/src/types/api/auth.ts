import type { IdRef } from "@/src/types/api/common";

export type LoginRequestDTO = {
  identity: string;
  password: string;
  remember?: boolean;
};

export type LoginResponseDTO = {
  token?: string;
  access_token?: string;
  bearer_token?: string;
  requires_2fa?: boolean;
  two_fa_required?: boolean;
};

export type PermissionDTO = IdRef & {
  name?: string;
};

export type RoleDTO = IdRef & {
  name?: string;
  permissions?: PermissionDTO[] | string[];
  policies?: PolicyDTO[];
};

export type PolicyDTO = IdRef & {
  permissions?: PermissionDTO[] | string[];
};

export type UserDTO = IdRef & {
  name?: string;
  full_name?: string;
  email?: string;
  role?: RoleDTO | string;
  role_name?: string;
  company_role?: string;
  permissions?: PermissionDTO[] | string[];
  policies?: PolicyDTO[];
  is_admin?: boolean;
  type?: string;
  driver_uuid?: string;
  driver?: IdRef & { public_id?: string };
};

export type OrganizationDTO = IdRef & {
  name?: string;
  company_name?: string;
  role?: string;
  pivot?: { role?: string };
};

