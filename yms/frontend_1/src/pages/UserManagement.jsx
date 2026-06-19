import React, { useEffect, useMemo, useState } from "react";
import { Lock, Pencil, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import {
  createAdminUser,
  updateAdminUser,
  listAdminUsers,
  deleteAdminUser,
  listAdminRoles,
} from "../services/adminApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const FIELD_CLASS = "w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";
const BTN_PRIMARY_CLASS = "inline-flex items-center justify-center rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-3 py-2";
const BTN_OUTLINE_CLASS = "inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-700 text-sm font-semibold px-3 py-2";

const emptyCreateForm = {
  fullName: "",
  username: "",
  email: "",
  role: "yard_manager",
  password: "",
  confirmPassword: "",
  status: "active",
};

function roleLabel(roleCode) {
  return roleCode.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", role: "yard_manager", status: "active" });
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [resetErrors, setResetErrors] = useState({});

  const userCountText = useMemo(
    () => `${users.filter((user) => user.status === "active").length} active · ${users.length} total`,
    [users]
  );

  const loadUsers = async () => {
    const [usersResp, rolesResp] = await Promise.all([
      listAdminUsers(),
      listAdminRoles(),
    ]);
    setUsers(usersResp);
    const mappedRoles = rolesResp.map((r) => ({ code: r.code, label: r.label }));
    setRoleOptions(mappedRoles);
    if (!createForm.role && mappedRoles.length > 0) {
      setCreateForm((s) => ({ ...s, role: mappedRoles[0].code }));
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await loadUsers();
      } catch (error) {
        toast.error(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } catch (error) {
      toast.error(error.message || "Failed to refresh users");
    } finally {
      setRefreshing(false);
    }
  };

  const validateCreate = () => {
    const errors = {};
    if (!createForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!createForm.username.trim()) errors.username = "Username is required.";
    if (!createForm.email.trim()) errors.email = "Email is required.";
    if (!createForm.role) errors.role = "Role is required.";
    if (!createForm.password) errors.password = "Password is required.";
    if (!createForm.confirmPassword) errors.confirmPassword = "Confirm password is required.";
    if (createForm.password && createForm.confirmPassword && createForm.password !== createForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEdit = () => {
    const errors = {};
    if (!editForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!editForm.email.trim()) errors.email = "Email is required.";
    if (!editForm.role) errors.role = "Role is required.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateReset = () => {
    const errors = {};
    if (!resetForm.password) errors.password = "Password is required.";
    if (!resetForm.confirmPassword) errors.confirmPassword = "Confirm password is required.";
    if (resetForm.password && resetForm.confirmPassword && resetForm.password !== resetForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setResetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "yard_manager",
      status: user.status || "active",
    });
    setEditErrors({});
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      await createAdminUser(createForm);
      await loadUsers();
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      setCreateErrors({});
      toast.success("User created successfully");
    } catch (error) {
      if (error.status === 409) {
        setCreateErrors((prev) => ({ ...prev, username: "Username must be unique." }));
        return;
      }
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleEditSave = async () => {
    if (!editUser || !validateEdit()) return;
    try {
      await updateAdminUser(editUser.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        status: editForm.status,
      });
      await loadUsers();
      setEditUser(null);
      toast.success("User updated");
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !validateReset()) return;
    try {
      await updateAdminUser(resetUser.id, { password: resetForm.password });
      await loadUsers();
      setResetUser(null);
      setResetForm({ password: "", confirmPassword: "" });
      toast.success("Password reset complete");
    } catch (error) {
      toast.error(error.message || "Password reset failed");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await updateAdminUser(user.id, {
        status: user.status === "active" ? "inactive" : "active",
      });
      await loadUsers();
      toast.success(user.status === "active" ? "User deactivated" : "User activated");
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      await deleteAdminUser(user.id);
      await loadUsers();
      toast.success("User deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-600">{userCountText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            type="button"
            data-testid="add-user-btn"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading users…</td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{user.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{user.username}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{roleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 disabled:opacity-40"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit User
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => {
                          setResetUser(user);
                          setResetForm({ password: "", confirmPassword: "" });
                          setResetErrors({});
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 disabled:opacity-40"
                      >
                        <Lock className="w-3.5 h-3.5" /> Reset Password
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-md border disabled:opacity-40 ${
                          user.status === "active"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {user.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => handleDeleteUser(user)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-md border border-red-200 text-red-700 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">User administration is database-backed.</div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new YARD.OS user account with business role access.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full Name" error={createErrors.fullName}>
              <input className={FIELD_CLASS} value={createForm.fullName} onChange={(e) => setCreateForm((s) => ({ ...s, fullName: e.target.value }))} />
            </FormField>
            <FormField label="Username" error={createErrors.username}>
              <input className={FIELD_CLASS} value={createForm.username} onChange={(e) => setCreateForm((s) => ({ ...s, username: e.target.value }))} />
            </FormField>
            <FormField label="Email" error={createErrors.email}>
              <input className={FIELD_CLASS} type="email" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} />
            </FormField>
            <FormField label="Role" error={createErrors.role}>
              <select className={FIELD_CLASS} value={createForm.role} onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value }))}>
                {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
              </select>
            </FormField>
            <FormField label="Password" error={createErrors.password}>
              <input className={FIELD_CLASS} type="password" value={createForm.password} onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))} />
            </FormField>
            <FormField label="Confirm Password" error={createErrors.confirmPassword}>
              <input className={FIELD_CLASS} type="password" value={createForm.confirmPassword} onChange={(e) => setCreateForm((s) => ({ ...s, confirmPassword: e.target.value }))} />
            </FormField>
            <FormField label="Status">
              <select className={FIELD_CLASS} value={createForm.status} onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}>
                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </FormField>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setCreateOpen(false)} className={BTN_OUTLINE_CLASS}>Cancel</button>
            <button type="button" onClick={handleCreate} className={BTN_PRIMARY_CLASS}>Create User</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile, role, and account status.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Full Name" error={editErrors.fullName}>
              <input className={FIELD_CLASS} value={editForm.fullName} onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))} />
            </FormField>
            <FormField label="Username (locked)">
              <input className={`${FIELD_CLASS} bg-slate-50 text-slate-500`} value={editUser?.username || ""} disabled />
            </FormField>
            <FormField label="Email" error={editErrors.email}>
              <input className={FIELD_CLASS} type="email" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />
            </FormField>
            <FormField label="Role" error={editErrors.role}>
              <select className={FIELD_CLASS} value={editForm.role} onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value }))}>
                {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select className={FIELD_CLASS} value={editForm.status} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}>
                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </FormField>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setEditUser(null)} className={BTN_OUTLINE_CLASS}>Cancel</button>
            <button type="button" onClick={handleEditSave} className={BTN_PRIMARY_CLASS}>Save Changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {resetUser?.fullName || "selected user"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <FormField label="New Password" error={resetErrors.password}>
              <input className={FIELD_CLASS} type="password" value={resetForm.password} onChange={(e) => setResetForm((s) => ({ ...s, password: e.target.value }))} />
            </FormField>
            <FormField label="Confirm Password" error={resetErrors.confirmPassword}>
              <input className={FIELD_CLASS} type="password" value={resetForm.confirmPassword} onChange={(e) => setResetForm((s) => ({ ...s, confirmPassword: e.target.value }))} />
            </FormField>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setResetUser(null)} className={BTN_OUTLINE_CLASS}>Cancel</button>
            <button type="button" onClick={handleResetPassword} className={BTN_PRIMARY_CLASS}>Update Password</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-red-600">{error}</span> : null}
    </label>
  );
}
