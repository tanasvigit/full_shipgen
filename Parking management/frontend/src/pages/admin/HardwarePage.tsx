import { useOutletContext } from 'react-router-dom';
import { RefreshCw, Power, Wifi, WifiOff } from 'lucide-react';
import Header from '../../components/layout/Header';
import { StatusBadge, Card } from '../../components/ui';
import { useEffect, useState } from 'react';
import { listHardware } from '../../api/hardware';
import type { HardwareDevice } from '../../types';

export default function HardwarePage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [hardware, setHardware] = useState<HardwareDevice[]>([]);

  useEffect(() => {
    listHardware()
      .then(setHardware)
      .catch(() => setHardware([]));
  }, []);

  const onlineCount = hardware.filter((device) => device.status === 'Online').length;

  return (
    <>
      <Header title="Hardware" subtitle="Monitor and configure connected devices" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Devices</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{hardware.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Online</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{onlineCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Offline</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{hardware.length - onlineCount}</p>
          </div>
        </div>

        {/* Device cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hardware.map((device) => (
            <Card key={device.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${device.status === 'Online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {device.status === 'Online' ? <Wifi size={22} /> : <WifiOff size={22} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{device.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{device.type} · {device.location}</p>
                    <p className="text-xs text-slate-400 mt-1">Last ping: {device.lastPing}</p>
                  </div>
                </div>
                <StatusBadge
                  label={device.status}
                  variant={device.status === 'Online' ? 'success' : 'danger'}
                />
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <RefreshCw size={12} /> Restart
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors">
                  <Power size={12} /> {device.status === 'Online' ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
