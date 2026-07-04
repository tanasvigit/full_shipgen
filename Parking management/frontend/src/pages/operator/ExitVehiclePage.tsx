import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CarFront, LogOut, Search } from 'lucide-react';
import Header from '../../components/layout/Header';
import { Card, StatusBadge } from '../../components/ui';
import { exitTicket } from '../../api/tickets';
import { useParkingFloors } from '../../context/ParkingFloorContext';

export default function ExitVehiclePage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { tickets, reload } = useParkingFloors();
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (ticket.status === 'Exited') return false;
      if (!query) return true;
      return (
        ticket.id.toLowerCase().includes(query) ||
        ticket.vehicleNumber.toLowerCase().includes(query)
      );
    });
  }, [tickets, searchTerm]);

  const handleExit = async (ticketId: string) => {
    setError('');
    setSuccess('');
    setProcessingId(ticketId);
    try {
      const updated = await exitTicket(ticketId);
      setSuccess(`Vehicle ${updated.vehicleNumber} exited successfully.`);
      await reload();
    } catch (exitError) {
      setError(exitError instanceof Error ? exitError.message : 'Unable to exit vehicle.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Header
        title="Exit Vehicle"
        subtitle="Mark active tickets as exited from the parking lot"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="exit-vehicle-page">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
            data-testid="exit-vehicle-search-input"
          />
        </div>

        {error && <p className="text-sm text-red-600" data-testid="exit-vehicle-error">{error}</p>}
        {success && <p className="text-sm text-emerald-700" data-testid="exit-vehicle-success">{success}</p>}

        <Card title={`Active Tickets (${activeTickets.length})`} padding={false}>
          <div className="divide-y divide-slate-50">
            {activeTickets.map((ticket) => {
              const pending = processingId === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3 hover:bg-slate-50/50"
                  data-testid="exit-vehicle-row"
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{ticket.id}</p>
                    <p className="text-xs text-slate-500">
                      {ticket.vehicleNumber} · {ticket.category} · {ticket.floorName ?? 'Floor —'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      label={ticket.status}
                      variant={ticket.status === 'Paid' ? 'success' : 'warning'}
                    />
                    <button
                      type="button"
                      onClick={() => void handleExit(ticket.id)}
                      disabled={pending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#ea1c26] hover:bg-[#d81822] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                      data-testid="exit-vehicle-button"
                    >
                      <LogOut size={14} />
                      {pending ? 'Exiting…' : 'Exit Vehicle'}
                    </button>
                  </div>
                </div>
              );
            })}
            {activeTickets.length === 0 && (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                No active tickets found.
              </div>
            )}
          </div>
        </Card>

        {!tickets.some((ticket) => ticket.status !== 'Exited') && (
          <div className="text-center py-12">
            <CarFront size={44} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">All vehicles are already exited.</p>
          </div>
        )}
      </main>
    </>
  );
}
