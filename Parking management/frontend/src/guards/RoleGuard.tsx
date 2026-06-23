import ProtectedRoute from './ProtectedRoute';
import type { UserRole } from '../types';

interface RoleGuardProps {
  allowedRole: UserRole;
}

export default function RoleGuard({ allowedRole }: RoleGuardProps) {
  return <ProtectedRoute allowedRoles={[allowedRole]} />;
}
