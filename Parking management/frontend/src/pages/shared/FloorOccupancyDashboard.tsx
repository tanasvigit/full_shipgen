import { FloorOccupancyCard, OccupancySummaryCard } from '../../components/parking';
import { useParkingFloors } from '../../context/ParkingFloorContext';

export default function FloorOccupancyDashboard() {
  const { floors, facilitySummary } = useParkingFloors();

  return (
    <div className="space-y-6">
      <OccupancySummaryCard summary={facilitySummary} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {floors.map((floor) => (
          <FloorOccupancyCard key={floor.id} floor={floor} />
        ))}
      </div>
    </div>
  );
}
