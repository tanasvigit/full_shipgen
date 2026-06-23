import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, MoreVertical, Search } from 'lucide-react';
import Header from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { createUser, deleteUser, listUsers, updateUser } from '../../api/users';
import type { User, UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  operator: 'Operator',
};

type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'active' | 'inactive';
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  role: 'operator',
  status: 'active',
};

export default function UserManagement() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const nextUsers = await listUsers(searchTerm || undefined);
      setUsers(nextUsers);
    } catch {
      setUsers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuUserId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filtered = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const closeModal = () => {
    setModalMode(null);
    setEditingUserId(null);
    setForm(emptyForm);
    setFormError('');
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setFormError('');
    setEditingUserId(null);
    setModalMode('create');
    setOpenMenuUserId(null);
  };

  const openEditModal = (user: User) => {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    });
    setFormError('');
    setEditingUserId(user.id);
    setModalMode('edit');
    setOpenMenuUserId(null);
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }

    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        status: form.status,
      });
      closeModal();
      await loadUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create user.');
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!editingUserId) {
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    if (form.password && form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(editingUserId, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      });
      closeModal();
      await loadUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to update user.');
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setOpenMenuUserId(null);

    if (user.id === currentUser?.id) {
      window.alert('You cannot change the status of your own account.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const confirmed = window.confirm(
      nextStatus === 'inactive'
        ? `Deactivate ${user.email}? They will not be able to sign in.`
        : `Activate ${user.email}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      if (nextStatus === 'inactive') {
        await updateUser(user.id, { status: 'inactive' });
      } else {
        await updateUser(user.id, { status: 'active' });
      }
      await loadUsers();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to update user status.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    setOpenMenuUserId(null);

    if (user.id === currentUser?.id) {
      window.alert('You cannot delete your own account.');
      return;
    }

    if (
      !window.confirm(
        `Permanently delete ${user.email}? This removes the account from the database and cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteUser(user.id);
      await loadUsers();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to delete user.');
    }
  };

  return (
    <>
      <Header title="Employee Management" subtitle="Manage employees and roles" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="user-management-page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full sm:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="bg-transparent text-sm outline-none w-full"
              data-testid="user-search-input"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all"
            data-testid="add-user-button"
          >
            <Plus size={16} /> Add User
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden" data-testid="users-table-card">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full" data-testid="users-table">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Email', 'Role', 'Status', 'Created', ''].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors" data-testid="user-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {user.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                        </div>
                        <span className="font-medium text-sm text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        label={roleLabels[user.role]}
                        variant={user.role === 'admin' ? 'info' : user.role === 'supervisor' ? 'warning' : 'neutral'}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        label={user.status === 'active' ? 'Active' : 'Inactive'}
                        variant={user.status === 'active' ? 'success' : 'danger'}
                        dot
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.createdAt}</td>
                    <td className="px-6 py-4 relative">
                      <div ref={openMenuUserId === user.id ? menuRef : null} className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setOpenMenuUserId((current) => (current === user.id ? null : user.id))}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                          aria-label={`Actions for ${user.name}`}
                          data-testid="user-actions-button"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuUserId === user.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              data-testid="edit-user-button"
                            >
                              Edit user
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(user)}
                              disabled={user.id === currentUser?.id}
                              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                              data-testid="toggle-user-status-button"
                            >
                              {user.status === 'active' ? 'Deactivate account' : 'Activate account'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteUser(user)}
                              disabled={user.id === currentUser?.id}
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                              data-testid="delete-user-button"
                            >
                              Delete user
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modalMode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
            data-testid="user-modal-overlay"
          >
            <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} data-testid="user-modal">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
              </h3>
              <form
                className="space-y-4"
                onSubmit={(event) => void (modalMode === 'create' ? handleCreateUser(event) : handleUpdateUser(event))}
                data-testid="user-form"
              >
                <div>
                  <label htmlFor="user-form-name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                  <input
                    id="user-form-name"
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    data-testid="user-form-name"
                  />
                </div>
                <div>
                  <label htmlFor="user-form-email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                  <input
                    id="user-form-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                    data-testid="user-form-email"
                  />
                </div>
                <div>
                  <label htmlFor="user-form-role" className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                  <select
                    id="user-form-role"
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    data-testid="user-form-role"
                  >
                    <option value="operator">Operator</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {modalMode === 'edit' && (
                  <div>
                    <label htmlFor="user-form-status" className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                    <select
                      id="user-form-status"
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, status: event.target.value as UserFormState['status'] }))
                      }
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      data-testid="user-form-status"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="user-form-password" className="block text-sm font-medium text-slate-600 mb-1">
                    {modalMode === 'create' ? 'Password' : 'New Password'}
                  </label>
                  <input
                    id="user-form-password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={modalMode === 'create' ? 'Set password' : 'Leave blank to keep current password'}
                    data-testid="user-form-password"
                  />
                </div>
                {formError && <p className="text-sm text-red-600" data-testid="user-form-error">{formError}</p>}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    data-testid="user-form-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 disabled:bg-blue-400"
                    data-testid="user-form-submit"
                  >
                    {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
