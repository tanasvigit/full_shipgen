import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card, StatusBadge } from '../../components/ui';
import { useEffect, useState } from 'react';
import { listAuditLogs } from '../../api/audit';
import type { AuditLog } from '../../types';

export default function AuditLogs() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    listAuditLogs()
      .then(setAuditLogs)
      .catch(() => setAuditLogs([]));
  }, []);

  return (
    <>
      <Header title="Audit Logs" subtitle="System activity and user action history" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <Card title="Activity Log" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Action', 'User', 'Role', 'Timestamp', 'Details'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{log.action}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{log.user}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge label={log.role === 'admin' ? 'Admin' : 'Operator'} variant={log.role === 'admin' ? 'info' : 'neutral'} />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{log.timestamp}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}
