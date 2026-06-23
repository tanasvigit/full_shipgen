import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import { Card, StatusBadge, DataTable } from '../../components/ui';
import { listQrScans } from '../../api/monitoring';

export default function SupervisorQRMonitoringPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [qrScanActivity, setQrScanActivity] = useState<Array<{
    id: string;
    ticket: string;
    vehicle: string;
    action: string;
    status: string;
    time: string;
  }>>([]);

  useEffect(() => {
    listQrScans()
      .then(setQrScanActivity)
      .catch(() => setQrScanActivity([]));
  }, []);

  const columns = [
    { key: 'id', header: 'Scan ID' },
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
      <Header title="QR Monitoring" subtitle="Track QR scan events in real time" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><QrCode size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Total Scans Today</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">2,342</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Valid Scans</p>
              <p className="text-2xl font-bold text-green-600 mt-1">2,310</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-500"><XCircle size={22} /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Invalid/Duplicate</p>
              <p className="text-2xl font-bold text-red-500 mt-1">32</p>
            </div>
          </div>
        </div>

        <Card title="Recent QR Scans" padding={false}>
          <DataTable columns={columns} data={qrScanActivity} />
        </Card>
      </main>
    </>
  );
}
