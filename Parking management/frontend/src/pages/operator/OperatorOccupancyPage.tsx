import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { FloorOccupancyCard, OccupancySummaryCard } from '../../components/parking';
import { useParkingFloors } from '../../context/ParkingFloorContext';

export default function OperatorOccupancyPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { floors, facilitySummary } = useParkingFloors();

  return (
    <>
      <Header
        title="Occupancy Summary"
        subtitle="Check floor availability before issuing tickets"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <OccupancySummaryCard summary={facilitySummary} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {floors.map((floor) => (
            <FloorOccupancyCard key={floor.id} floor={floor} />
          ))}
        </div>
      </main>
    </>
  );
}
