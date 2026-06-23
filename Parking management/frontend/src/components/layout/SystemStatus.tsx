interface SystemStatusProps {
  collapsed?: boolean;
}

export default function SystemStatus({ collapsed = false }: SystemStatusProps) {
  if (collapsed) return null;

  return (
    <div className="mb-4 mx-2 p-3 bg-white/5 rounded-lg">
      <p className="text-slate-400 text-xs">System Status</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white text-xs">All Devices Online</span>
      </div>
    </div>
  );
}
