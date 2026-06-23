import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { Card, StatusBadge } from '../../components/ui';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import { listQrScans } from '../../api/monitoring';

export default function QRMonitoring() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [qrLogs, setQrLogs] = useState<Array<{
    id: string;
    ticket: string;
    vehicle: string;
    action: string;
    status: string;
    time: string;
  }>>([]);

  useEffect(() => {
    listQrScans()
      .then(setQrLogs)
      .catch(() => setQrLogs([]));
  }, []);

  const validCount = useMemo(() => qrLogs.filter((log) => log.status === 'Valid').length, [qrLogs]);
  const invalidCount = qrLogs.length - validCount;

  return (
    <>
      <Header title="QR Monitoring" subtitle="Track QR scan events in real-time" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><QrCode size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Total Scans Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{qrLogs.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Valid Scans</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{validCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-500"><XCircle size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Invalid/Duplicate</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{invalidCount}</p>
            </div>
          </div>
        </div>

        <Card title="Recent QR Scan Activity" padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Scan ID', 'Ticket', 'Vehicle', 'Action', 'Status', 'Time'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {qrLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{log.id}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{log.ticket}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{log.vehicle}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{log.action}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge label={log.status} variant={log.status === 'Valid' ? 'success' : 'danger'} />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{log.time}</td>
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
