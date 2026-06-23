import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../config/permissions';
import { parkingAuthPath, parkingPath } from '../constants/basePath';

export default function ParkingHomeRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to={parkingAuthPath()} replace />;
  }

  return <Navigate to={parkingPath(getDashboardPath(user.role))} replace />;
}
