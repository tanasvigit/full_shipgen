import { BUSINESS_ROLES } from "../constants/adminRoleCatalog";

const STORAGE_KEY = "yms_admin_users_v1";

const DEFAULT_USERS = [
  {
    id: "seed-admin",
    fullName: "Yard Administrator",
    username: "admin",
    email: "admin@yardos.demo",
    role: "yard_admin",
    status: "active",
    password: "admin123",
  },
  {
    id: "seed-manager",
    fullName: "Yard Manager",
    username: "manager",
    email: "manager@yardos.demo",
    role: "yard_manager",
    status: "active",
    password: "manager123",
  },
  {
    id: "seed-gate",
    fullName: "Gate Operator",
    username: "gate",
    email: "gate@yardos.demo",
    role: "gate_operator",
    status: "active",
    password: "gate123",
  },
  {
    id: "seed-coordinator",
    fullName: "Yard Coordinator",
    username: "coordinator",
    email: "coordinator@yardos.demo",
    role: "yard_coordinator",
    status: "active",
    password: "coordinator123",
  },
  {
    id: "seed-supervisor",
    fullName: "Dock Supervisor",
    username: "supervisor",
    email: "supervisor@yardos.demo",
    role: "dock_supervisor",
    status: "active",
    password: "supervisor123",
  },
];

function normalizeUsers(users) {
  const validRoles = new Set(BUSINESS_ROLES.map((role) => role.code));
  return users.map((user) => ({
    ...user,
    role: validRoles.has(user.role) ? user.role : "yard_manager",
    status: user.status === "inactive" ? "inactive" : "active",
  }));
}

function save(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function listAdminUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    save(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  try {
    return normalizeUsers(JSON.parse(raw));
  } catch {
    save(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
}

export function createAdminUser(payload) {
  const users = listAdminUsers();
  const usernameLower = payload.username.trim().toLowerCase();
  if (users.some((user) => user.username.toLowerCase() === usernameLower)) {
    const error = new Error("Username already exists");
    error.code = "USERNAME_EXISTS";
    throw error;
  }
  const next = {
    id: `user-${Date.now()}`,
    fullName: payload.fullName.trim(),
    username: payload.username.trim(),
    email: payload.email.trim(),
    role: payload.role,
    status: payload.status,
    password: payload.password,
  };
  const updated = [...users, next];
  save(updated);
  return next;
}

export function updateAdminUser(userId, patch) {
  const users = listAdminUsers();
  const updated = users.map((user) => (user.id === userId ? { ...user, ...patch } : user));
  save(updated);
  return updated.find((user) => user.id === userId) || null;
}

export function setAdminUserPassword(userId, password) {
  return updateAdminUser(userId, { password });
}

export function toggleAdminUserStatus(userId) {
  const users = listAdminUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) return null;
  const status = target.status === "active" ? "inactive" : "active";
  return updateAdminUser(userId, { status });
}
