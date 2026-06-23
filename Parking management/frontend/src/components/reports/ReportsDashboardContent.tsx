import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard, Card } from '../ui';
import type { ReportsDashboardData } from '../../types/reports';

type ReportsDashboardContentProps = {
  data: ReportsDashboardData;
  periodHint: string;
  revenueChartTitle?: string;
};

export default function ReportsDashboardContent({
  data,
  periodHint,
  revenueChartTitle = 'Revenue Trend',
}: ReportsDashboardContentProps) {
  const avgPerDay =
    data.rangeDayCount > 0 ? Math.round(data.totalRevenue / data.rangeDayCount) : 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Entries"
          value={data.totalEntries.toLocaleString()}
          trend={{ value: periodHint, positive: true }}
        />
        <StatCard label="Total Exits" value={data.totalExits.toLocaleString()} trend={{ value: periodHint, positive: false }} />
        <StatCard
          label="Vehicles Inside (now)"
          value={data.vehiclesInside.toLocaleString()}
          trend={{ value: 'Current active tickets', positive: true }}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString()}`}
          trend={{ value: periodHint, positive: true }}
        />
        <StatCard label="Avg Revenue/Day" value={`₹${avgPerDay.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={revenueChartTitle} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenuePoints} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="revenue" fill="#ea1c26" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Category Distribution">
          <div className="h-72">
            {data.categoryData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-500">
                No category entries for this period.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
