import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { TicketPreview } from '../../components/ui';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import { Search, Printer } from 'lucide-react';

export default function QRPrintPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { tickets } = useParkingFloors();
  const [searchTerm, setSearchTerm] = useState('');
  const paidTickets = useMemo(() => tickets.filter((ticket) => ticket.status === 'Paid'), [tickets]);
  const [selectedTicket, setSelectedTicket] = useState(paidTickets[0] ?? null);

  return (
    <>
      <Header title="QR Ticket Print" subtitle="Reprint or print new QR tickets" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="qr-print-page">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-md">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search ticket ID to reprint..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent text-sm outline-none w-full" data-testid="qr-print-search-input" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket List */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Select Ticket to Print</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto" data-testid="qr-print-ticket-list">
              {paidTickets.map((t) => (
                <button key={t.id} onClick={() => setSelectedTicket(t)} className={`w-full text-left px-6 py-3.5 flex items-center justify-between hover:bg-blue-50/50 transition-colors ${selectedTicket?.id === t.id ? 'bg-blue-50' : ''}`} data-testid="qr-print-ticket-option">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{t.id}</p>
                    <p className="text-xs text-slate-500">{t.vehicleNumber} · {t.category}</p>
                  </div>
                  <Printer size={14} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedTicket && (
            <TicketPreview ticketId={selectedTicket.id} vehicleNumber={selectedTicket.vehicleNumber} amount={selectedTicket.amount} onPrint={() => window.print()} />
          )}
        </div>
      </main>
    </>
  );
}
