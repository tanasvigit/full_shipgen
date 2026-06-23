import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { StatusBadge, Card } from '../../components/ui';
import { useParkingFloors } from '../../context/ParkingFloorContext';

export default function RecentTicketsPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { tickets } = useParkingFloors();

  return (
    <>
      <Header title="Recent Tickets" subtitle="All recently generated tickets" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="recent-tickets-page">
        <Card title={`All Tickets (${tickets.length})`} padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="recent-tickets-table">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Ticket ID', 'Vehicle', 'Category', 'Floor', 'Slot', 'Entry Time', 'Payment', 'Amount', 'Status'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50" data-testid="recent-ticket-row">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{ticket.id}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{ticket.vehicleNumber}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{ticket.category}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{ticket.floorName ?? '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{ticket.slotStatus ?? '-'}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{ticket.entryTime}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{ticket.paymentMethod}</td>
                    <td className="px-6 py-3.5 text-sm font-medium">₹{ticket.amount}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge
                        label={ticket.status}
                        variant={ticket.status === 'Paid' ? 'success' : ticket.status === 'Unpaid' ? 'warning' : 'neutral'}
                      />
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
