import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card, StatusBadge } from '../../components/ui';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import { collectPayment } from '../../api/tickets';
import { Search, CheckCircle } from 'lucide-react';
import type { PaymentMethod } from '../../types';

export default function CollectPaymentPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { tickets, reload } = useParkingFloors();
  const [searchTerm, setSearchTerm] = useState('');
  const [collected, setCollected] = useState<string[]>([]);
  const [error, setError] = useState('');

  const unpaidTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === 'Unpaid' &&
          (searchTerm.length === 0 ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [tickets, searchTerm],
  );

  const handleCollect = async (ticketId: string) => {
    setError('');
    try {
      await collectPayment(ticketId, 'Cash' as PaymentMethod);
      setCollected((prev) => [...prev, ticketId]);
      await reload();
    } catch (collectError) {
      setError(collectError instanceof Error ? collectError.message : 'Unable to collect payment.');
    }
  };

  return (
    <>
      <Header title="Collect Payment" subtitle="Process pending parking payments" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="collect-payment-page">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket ID or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm outline-none w-full"
            data-testid="collect-payment-search-input"
          />
        </div>

        {error && <p className="text-sm text-red-600" data-testid="collect-payment-error">{error}</p>}

        <Card title={`Unpaid Tickets (${unpaidTickets.length})`} padding={false}>
          <div className="divide-y divide-slate-50">
            {unpaidTickets.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3 hover:bg-slate-50/50" data-testid="unpaid-ticket-row">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{t.id}</p>
                  <p className="text-xs text-slate-500">
                    {t.vehicleNumber} · {t.category}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-800">₹{t.amount}</span>
                  {collected.includes(t.id) || t.status === 'Paid' ? (
                    <StatusBadge label="Collected" variant="success" dot />
                  ) : (
                    <button
                      onClick={() => void handleCollect(t.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-green-600/20 transition-all hover:-translate-y-0.5"
                      data-testid="collect-payment-button"
                    >
                      <CheckCircle size={14} /> Collect
                    </button>
                  )}
                </div>
              </div>
            ))}
            {unpaidTickets.length === 0 && (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No unpaid tickets</div>
            )}
          </div>
        </Card>
      </main>
    </>
  );
}
