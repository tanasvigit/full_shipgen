import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { StatusBadge, Card } from '../../components/ui';
import { searchTickets } from '../../api/tickets';
import type { ParkingTicket } from '../../types';
import { Search } from 'lucide-react';

export default function VehicleSearchPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ParkingTicket[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setError('');
      return;
    }

    const timeout = window.setTimeout(() => {
      searchTickets(searchTerm.trim())
        .then((tickets) => {
          setResults(tickets);
          setError('');
        })
        .catch((searchError) => {
          setResults([]);
          setError(searchError instanceof Error ? searchError.message : 'Search failed.');
        });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <>
      <Header title="Vehicle Search" subtitle="Find vehicles by number or ticket ID" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="vehicle-search-page">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 max-w-lg shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input type="text" placeholder="Enter vehicle number or ticket ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} className="bg-transparent text-sm outline-none w-full" data-testid="vehicle-search-input" />
        </div>

        {error && <p className="text-sm text-red-600" data-testid="vehicle-search-error">{error}</p>}

        {searchTerm.length > 0 && (
          <Card title={`Results (${results.length})`} padding={false}>
            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="vehicle-search-results">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Ticket ID', 'Vehicle', 'Category', 'Floor', 'Entry Time', 'Amount', 'Status'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {results.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50" data-testid="vehicle-search-result-row">
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
            ) : (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">No vehicles found for "{searchTerm}"</div>
            )}
          </Card>
        )}

        {searchTerm.length === 0 && (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">Enter a vehicle number or ticket ID to search</p>
          </div>
        )}
      </main>
    </>
  );
}
