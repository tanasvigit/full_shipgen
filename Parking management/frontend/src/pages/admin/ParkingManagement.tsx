import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { StatCard, StatusBadge, Card } from '../../components/ui';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import { Car, ParkingCircle } from 'lucide-react';

export default function ParkingManagement() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { tickets, facilitySummary } = useParkingFloors();
  const activeTickets = tickets.filter((ticket) => ticket.status !== 'Exited');

  return (
    <>
      <Header title="Parking Management" subtitle="Monitor active parking sessions" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Vehicles" value={facilitySummary.totalOccupied} icon={<Car size={20} />} />
          <StatCard label="Total Slots" value={facilitySummary.totalCapacity} icon={<ParkingCircle size={20} />} />
          <StatCard label="Available" value={facilitySummary.totalAvailable} />
        </div>

        <Card title="Active Parking Sessions" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Ticket ID', 'Vehicle', 'Category', 'Floor', 'Entry Time', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{t.id}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{t.vehicleNumber}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{t.category}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{t.floorName ?? '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{t.entryTime}</td>
                    <td className="px-6 py-3.5 text-sm font-medium">₹{t.amount}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge label={t.status} variant={t.status === 'Paid' ? 'success' : t.status === 'Unpaid' ? 'warning' : 'neutral'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
