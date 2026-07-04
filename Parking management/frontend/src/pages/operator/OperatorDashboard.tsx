import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Ticket, CreditCard, Printer, Search, Car, IndianRupee, AlertCircle, LogOut } from 'lucide-react';
import Header from '../../components/layout/Header';
import { StatCard, StatusBadge, DataTable } from '../../components/ui';
import { OccupancySummaryCard } from '../../components/parking';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import { getOperatorDashboard } from '../../api/dashboard';
import type { DashboardStats, ParkingTicket } from '../../types';

const shortcuts = [
  { label: 'Occupancy Summary', path: '/operator/occupancy', icon: Car, description: 'Check floor availability before issuing tickets' },
  { label: 'New Ticket', path: '/operator/new-ticket', icon: Ticket, description: 'Issue a parking ticket with QR code' },
  { label: 'Collect Payment', path: '/operator/collect-payment', icon: CreditCard, description: 'Record payment for unpaid tickets' },
  { label: 'QR Ticket Print', path: '/operator/qr-print', icon: Printer, description: 'Reprint tickets for customers' },
  { label: 'Vehicle Search', path: '/operator/vehicle-search', icon: Search, description: 'Look up active or past tickets' },
  { label: 'Exit Vehicle', path: '/operator/exit-vehicle', icon: LogOut, description: 'Mark a parked vehicle as exited' },
];

export default function OperatorDashboard() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { facilitySummary } = useParkingFloors();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ticketsToday, setTicketsToday] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [upiCount, setUpiCount] = useState(0);
  const [cashCount, setCashCount] = useState(0);
  const [recentTickets, setRecentTickets] = useState<ParkingTicket[]>([]);

  useEffect(() => {
    getOperatorDashboard()
      .then((dashboard) => {
        setStats(dashboard.stats);
        setTicketsToday(dashboard.ticketsToday);
        setUnpaidCount(dashboard.unpaidCount);
        setUpiCount(dashboard.upiCount);
        setCashCount(dashboard.cashCount);
        setRecentTickets(dashboard.recentTickets);
      })
      .catch(() => {
        setStats(null);
        setRecentTickets([]);
      });
  }, []);

  const recentColumns = [
    { key: 'id', header: 'Ticket ID' },
    { key: 'vehicleNumber', header: 'Vehicle' },
    { key: 'category', header: 'Category' },
    { key: 'floorName', header: 'Floor' },
    { key: 'amount', header: 'Amount', render: (row: ParkingTicket) => `₹${row.amount}` },
    {
      key: 'status',
      header: 'Status',
      render: (row: ParkingTicket) => (
        <StatusBadge label={row.status} variant={row.status === 'Paid' ? 'success' : 'warning'} />
      ),
    },
  ];

  return (
    <>
      <Header
        title="Operator Dashboard"
        subtitle="Shift overview and quick actions"
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <OccupancySummaryCard summary={facilitySummary} />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Tickets Today" value={ticketsToday} icon={<Ticket size={20} />} />
          <StatCard
            label="Unpaid Tickets"
            value={unpaidCount}
            icon={<AlertCircle size={20} />}
            trend={{ value: 'Needs collection', positive: false }}
          />
          <StatCard
            label="UPI vs Cash"
            value={`${upiCount} / ${cashCount}`}
            icon={<IndianRupee size={20} />}
          />
          <StatCard label="Vehicles Inside" value={stats?.vehiclesInside ?? 0} icon={<Car size={20} />} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.path}
                to={shortcut.path}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 hover:-translate-y-0.5 transition-all"
              >
                <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 w-fit mb-3">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-800">{shortcut.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{shortcut.description}</p>
              </Link>
            );
          })}
        </div>

        <DataTable
          title="Recent Tickets"
          action={
            <Link to="/operator/recent-tickets" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              View All
            </Link>
          }
          columns={recentColumns}
          data={recentTickets}
        />
      </main>
    </>
  );
}
