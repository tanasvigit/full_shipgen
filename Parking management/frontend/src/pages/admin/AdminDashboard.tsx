import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Car, ArrowUpRight, ArrowDownRight, IndianRupee, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../../components/layout/Header';
import { StatCard, StatusBadge, Card } from '../../components/ui';
import { getAdminDashboard } from '../../api/dashboard';
import { getRevenueReport } from '../../api/reports';
import { listEntries } from '../../api/monitoring';
import type { DashboardStats, HardwareDevice } from '../../types';

export default function AdminDashboard() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{ day: string; revenue: number }>>([]);
  const [recentEntries, setRecentEntries] = useState<Array<{ vehicle: string; category: string; time: string }>>([]);
  const [hardware, setHardware] = useState<HardwareDevice[]>([]);

  useEffect(() => {
    Promise.all([getAdminDashboard(), getRevenueReport({ preset: '7d' }), listEntries()])
      .then(([dashboard, revenue, entries]) => {
        setStats(dashboard.stats);
        setRevenueData(revenue.points);
        setRecentEntries(entries);
        setHardware(dashboard.hardware);
      })
      .catch(() => {
        setStats(null);
        setRevenueData([]);
        setRecentEntries([]);
        setHardware([]);
      });
  }, []);

  const occupiedPercent = stats?.totalSlots
    ? Math.round((stats.occupiedSlots / stats.totalSlots) * 100)
    : 0;
  const availablePercent = 100 - occupiedPercent;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Live parking analytics and monitoring"
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-6 flex-1">
        {/* ── Stat Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Vehicles Inside"
            value={stats?.vehiclesInside ?? 0}
            icon={<Car size={20} />}
            trend={{ value: '12% vs yesterday', positive: true }}
          />
          <StatCard
            label="Today Entries"
            value={(stats?.todayEntries ?? 0).toLocaleString()}
            icon={<ArrowUpRight size={20} />}
            trend={{ value: '8% increase', positive: true }}
          />
          <StatCard
            label="Today Exits"
            value={(stats?.todayExits ?? 0).toLocaleString()}
            icon={<ArrowDownRight size={20} />}
          />
          <StatCard
            label="Revenue Today"
            value={`₹${(stats?.revenueToday ?? 0).toLocaleString()}`}
            icon={<IndianRupee size={20} />}
            trend={{ value: '₹5,200 more', positive: true }}
          />
        </div>

        {/* ── Revenue Chart + Parking Status ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Analytics */}
          <Card
            title="Revenue Analytics"
            action={
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                <Download size={14} /> Export
              </button>
            }
            className="lg:col-span-2"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#ea1c26" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Parking Status */}
          <Card title="Parking Status">
            <div className="space-y-4">
              {/* Occupied */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Occupied</span>
                  <span className="text-slate-800 font-bold">{occupiedPercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${occupiedPercent}%` }} />
                </div>
              </div>

              {/* Available */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Available</span>
                  <span className="text-slate-800 font-bold">{availablePercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${availablePercent}%` }} />
                </div>
              </div>

              {/* Category counts */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">2W</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.twoWheelerCount ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">4W</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.fourWheelerCount ?? 0}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Recent Entries + Hardware Status ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Entries */}
          <Card
            title="Recent Entries"
            action={
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                View All
              </button>
            }
            padding={false}
          >
            <div className="divide-y divide-slate-50">
              {recentEntries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-sm text-slate-800">{entry.vehicle}</span>
                    <span className="text-sm text-slate-500">{entry.category}</span>
                  </div>
                  <span className="text-sm text-slate-400">{entry.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Hardware Status */}
          <Card
            title="Hardware Status"
            action={
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                Configure
              </button>
            }
            padding={false}
          >
            <div className="divide-y divide-slate-50">
              {hardware.map((device) => (
                <div key={device.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <span className="font-medium text-sm text-slate-800">{device.name}</span>
                  <StatusBadge
                    label={device.status}
                    variant={device.status === 'Online' ? 'success' : 'danger'}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
