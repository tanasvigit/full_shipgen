import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { FloorManagementTable } from '../../components/parking';
import { useAuth } from '../../context/AuthContext';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import { PERMISSIONS } from '../../config/permissions';
import FloorOccupancyDashboard from './FloorOccupancyDashboard';

export default function FloorManagementPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { hasPermission } = useAuth();
  const { floors, addFloor, updateFloor, removeFloor } = useParkingFloors();
  const canManage = hasPermission(PERMISSIONS.FLOORS_MANAGE);

  return (
    <>
      <Header
        title="Floor Management"
        subtitle={canManage ? 'Configure floors and monitor occupancy' : 'Monitor floor occupancy across the facility'}
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <FloorOccupancyDashboard />
        <FloorManagementTable
          floors={floors}
          canManage={canManage}
          onAddFloor={addFloor}
          onUpdateFloor={updateFloor}
          onRemoveFloor={removeFloor}
        />
      </main>
    </>
  );
}
