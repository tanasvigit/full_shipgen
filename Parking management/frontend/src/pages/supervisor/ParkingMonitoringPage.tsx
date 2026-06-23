import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card, StatCard, DataTable } from '../../components/ui';
import { getTrafficReport } from '../../api/reports';
import { listEntries, listExits } from '../../api/monitoring';

export default function ParkingMonitoringPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [stats, setStats] = useState({ vehiclesInside: 0, todayEntries: 0, todayExits: 0, occupiedSlots: 0, totalSlots: 0 });
  const [recentEntries, setRecentEntries] = useState<Array<{ vehicle: string; category: string; time: string }>>([]);
  const [recentExits, setRecentExits] = useState<Array<{ vehicle: string; category: string; time: string; ticketId?: string | null }>>([]);

  useEffect(() => {
    Promise.all([getTrafficReport({ preset: 'today' }), listEntries(), listExits()])
      .then(([traffic, entries, exits]) => {
        setStats({
          vehiclesInside: traffic.vehiclesInside,
          todayEntries: traffic.todayEntries,
          todayExits: traffic.todayExits,
          occupiedSlots: traffic.vehiclesInside,
          totalSlots: Math.max(traffic.vehiclesInside, 1),
        });
        setRecentEntries(entries);
        setRecentExits(exits);
      })
      .catch(() => {
        setStats({ vehiclesInside: 0, todayEntries: 0, todayExits: 0, occupiedSlots: 0, totalSlots: 0 });
        setRecentEntries([]);
        setRecentExits([]);
      });
  }, []);

  const occupiedPercent = stats.totalSlots
    ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100)
    : 0;

  return (
    <>
      <Header
        title="Parking Monitoring"
        subtitle="Live parking status and entry/exit flow"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Vehicles Inside" value={stats.vehiclesInside} />
          <StatCard label="Today Entries" value={stats.todayEntries.toLocaleString()} />
          <StatCard label="Today Exits" value={stats.todayExits.toLocaleString()} />
        </div>

        <Card title="Live Occupancy">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Occupied</span>
              <span className="text-slate-800 font-bold">{occupiedPercent}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${occupiedPercent}%` }} />
            </div>
            <p className="text-sm text-slate-500">
              {stats.occupiedSlots} of {stats.totalSlots} slots are currently occupied.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable title="Entry Monitoring" columns={[
            { key: 'vehicle', header: 'Vehicle' },
            { key: 'category', header: 'Category' },
            { key: 'time', header: 'Entry Time' },
          ]} data={recentEntries} />
          <DataTable title="Exit Monitoring" columns={[
            { key: 'vehicle', header: 'Vehicle' },
            { key: 'category', header: 'Category' },
            { key: 'time', header: 'Exit Time' },
            { key: 'ticketId', header: 'Ticket ID' },
          ]} data={recentExits} />
        </div>
      </main>
    </>
  );
}
