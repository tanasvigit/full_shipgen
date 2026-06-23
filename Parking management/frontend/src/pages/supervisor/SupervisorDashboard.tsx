import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Car, IndianRupee, Users, AlertTriangle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { Card, StatCard, StatusBadge, DataTable } from '../../components/ui';
import { getSupervisorDashboard } from '../../api/dashboard';
import { listEntries, listExits, listQrScans } from '../../api/monitoring';
import type { DashboardStats, ParkingTicket } from '../../types';

export default function SupervisorDashboard() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [occupancyPercent, setOccupancyPercent] = useState(0);
  const [activeOperators, setActiveOperators] = useState<Array<{
    id: string;
    name: string;
    shift: string;
    ticketsIssued: number;
    status: string;
  }>>([]);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    severity: string;
    title: string;
    detail: string;
    time: string;
  }>>([]);
  const [recentTickets, setRecentTickets] = useState<ParkingTicket[]>([]);
  const [recentEntries, setRecentEntries] = useState<Array<{ vehicle: string; category: string; time: string }>>([]);
  const [recentExits, setRecentExits] = useState<Array<{ vehicle: string; category: string; time: string; ticketId?: string | null }>>([]);
  const [qrScanActivity, setQrScanActivity] = useState<Array<{
    id: string;
    ticket: string;
    vehicle: string;
    action: string;
    status: string;
    time: string;
  }>>([]);

  useEffect(() => {
    Promise.all([getSupervisorDashboard(), listEntries(), listExits(), listQrScans()])
      .then(([dashboard, entries, exits, qrScans]) => {
        setStats(dashboard.stats);
        setOccupancyPercent(dashboard.occupancyPercent);
        setActiveOperators(dashboard.activeOperators);
        setAlerts(dashboard.alerts);
        setRecentTickets(dashboard.recentTickets);
        setRecentEntries(entries);
        setRecentExits(exits);
        setQrScanActivity(qrScans);
      })
      .catch(() => {
        setStats(null);
        setActiveOperators([]);
        setAlerts([]);
        setRecentTickets([]);
        setRecentEntries([]);
        setRecentExits([]);
        setQrScanActivity([]);
      });
  }, []);

  const occupiedPercent = occupancyPercent;
  const availablePercent = 100 - occupiedPercent;

  const entryColumns = [
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'category', header: 'Category' },
    { key: 'time', header: 'Time' },
  ];

  const exitColumns = [
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'category', header: 'Category' },
    { key: 'time', header: 'Time' },
    { key: 'ticketId', header: 'Ticket ID' },
  ];

  const qrColumns = [
    { key: 'ticket', header: 'Ticket' },
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'action', header: 'Action' },
    {
      key: 'status',
      header: 'Status',
      render: (row: (typeof qrScanActivity)[0]) => (
        <StatusBadge label={row.status} variant={row.status === 'Valid' ? 'success' : 'danger'} />
      ),
    },
    { key: 'time', header: 'Time' },
  ];

  return (
    <>
      <Header
        title="Supervisor Dashboard"
        subtitle="Live operations monitoring and shift oversight"
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Live Occupancy" value={`${occupiedPercent}%`} icon={<Car size={20} />} />
          <StatCard
            label="Active Operators"
            value={activeOperators.filter((operator) => operator.status === 'Active').length}
            icon={<Users size={20} />}
          />
          <StatCard
            label="Revenue Today"
            value={`₹${(stats?.revenueToday ?? 0).toLocaleString()}`}
            icon={<IndianRupee size={20} />}
          />
          <StatCard
            label="Open Alerts"
            value={alerts.length}
            icon={<AlertTriangle size={20} />}
            trend={{ value: 'View issues panel', positive: false }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Parking Slot Utilization" className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Occupied</span>
                  <span className="text-slate-800 font-bold">{occupiedPercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${occupiedPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Available</span>
                  <span className="text-slate-800 font-bold">{availablePercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${availablePercent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">2W Inside</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.twoWheelerCount ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">4W Inside</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.fourWheelerCount ?? 0}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Active Operators">
            <div className="space-y-3">
              {activeOperators.map((operator) => (
                <div key={operator.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{operator.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {operator.shift} shift · {operator.ticketsIssued} tickets
                    </p>
                  </div>
                  <StatusBadge
                    label={operator.status}
                    variant={operator.status === 'Active' ? 'success' : operator.status === 'On Break' ? 'warning' : 'neutral'}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable title="Recent Entries" columns={entryColumns} data={recentEntries} />
          <DataTable title="Recent Exits" columns={exitColumns} data={recentExits} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="QR Scan Activity" className="lg:col-span-2" padding={false}>
            <DataTable columns={qrColumns} data={qrScanActivity.slice(0, 5)} />
          </Card>

          <Card title="Alerts & Issues">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{alert.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{alert.detail}</p>
                    </div>
                    <StatusBadge
                      label={alert.severity}
                      variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'neutral'}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{alert.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Recent Tickets Snapshot">
          <DataTable
            columns={[
              { key: 'id', header: 'Ticket ID' },
              { key: 'vehicleNumber', header: 'Vehicle' },
              { key: 'category', header: 'Category' },
              { key: 'status', header: 'Status' },
            ]}
            data={recentTickets}
          />
        </Card>
      </main>
    </>
  );
}
