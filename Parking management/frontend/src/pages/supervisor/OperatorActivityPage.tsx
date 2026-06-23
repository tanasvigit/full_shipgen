import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { DataTable, StatCard } from '../../components/ui';
import { listActiveOperators, listAlerts } from '../../api/monitoring';

export default function OperatorActivityPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [activeOperators, setActiveOperators] = useState<Array<{ id: string; name: string; shift: string; ticketsIssued: number; status: string }>>([]);
  const [operatorActivity, setOperatorActivity] = useState<Array<{ id: string; operator: string; action: string; ticketId: string; vehicle: string; time: string }>>([]);

  useEffect(() => {
    Promise.all([listActiveOperators(), listAlerts()])
      .then(([operators, alerts]) => {
        setActiveOperators(operators);
        setOperatorActivity(
          alerts.map((alert) => ({
            id: alert.id,
            operator: 'System',
            action: alert.title,
            ticketId: '',
            vehicle: alert.detail,
            time: alert.time,
          })),
        );
      })
      .catch(() => {
        setActiveOperators([]);
        setOperatorActivity([]);
      });
  }, []);

  const columns = [
    { key: 'operator', header: 'Operator' },
    { key: 'action', header: 'Action' },
    { key: 'ticketId', header: 'Ticket ID' },
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'time', header: 'Time' },
  ];

  return (
    <>
      <Header
        title="Operator Activity"
        subtitle="Monitor operator actions across the current shift"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Active Operators" value={activeOperators.filter((item) => item.status === 'Active').length} />
          <StatCard label="On Break" value={activeOperators.filter((item) => item.status === 'On Break').length} />
          <StatCard label="Logged Actions" value={operatorActivity.length} />
        </div>

        <DataTable title="Recent Operator Actions" columns={columns} data={operatorActivity} />
      </main>
    </>
  );
}
