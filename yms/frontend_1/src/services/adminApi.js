import { request } from "./ymsApi";

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    email: user.email || "",
    role: user.role,
    status: user.status === "inactive" ? "inactive" : "active",
  };
}

function mapRole(role) {
  return {
    id: role.id,
    code: role.code,
    label: role.display_name || role.name || role.code,
    description: role.description || "",
    permissions: role.permissions || [],
  };
}

export async function listAdminUsers() {
  const users = await request("/admin/users");
  return (users || []).map(mapUser);
}

export async function createAdminUser(payload) {
  const created = await request("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      full_name: payload.fullName,
      username: payload.username,
      email: payload.email || null,
      role: payload.role,
      password: payload.password,
      status: payload.status,
    }),
  });
  return mapUser(created);
}

export async function updateAdminUser(userId, patch) {
  const body = {};
  if (patch.fullName !== undefined) body.full_name = patch.fullName;
  if (patch.email !== undefined) body.email = patch.email;
  if (patch.role !== undefined) body.role = patch.role;
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.password !== undefined) body.password = patch.password;
  const updated = await request(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapUser(updated);
}

export async function deleteAdminUser(userId) {
  return request(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function listAdminRoles() {
  const roles = await request("/admin/roles");
  return (roles || []).map(mapRole);
}

export async function listAdminPermissions() {
  return request("/admin/permissions");
}

export async function updateAdminRole(roleId, body) {
  const updated = await request(`/admin/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify({
      description: body.description,
      permissions: body.permissions || [],
    }),
  });
  return mapRole(updated);
}
