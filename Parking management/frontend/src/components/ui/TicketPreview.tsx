import { QrCode } from 'lucide-react';
import type { ParkingSlotStatus, VehicleCategory } from '../../types';
import SuccessButton from './SuccessButton';

interface TicketPreviewProps {
  ticketId: string;
  vehicleNumber: string;
  amount: number;
  category?: VehicleCategory;
  floorName?: string;
  floorNumber?: number;
  slotStatus?: ParkingSlotStatus;
  onPrint?: () => void;
}

export default function TicketPreview({
  ticketId,
  vehicleNumber,
  amount,
  category,
  floorName,
  floorNumber,
  slotStatus,
  onPrint,
}: TicketPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 text-center" data-testid="ticket-preview">
      <h3 className="font-semibold text-lg text-slate-800 mb-4">Generated Ticket</h3>

      <div className="mx-auto w-40 h-40 bg-slate-900 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {Array.from({ length: 10 }).map((_, i) =>
              Array.from({ length: 10 }).map((_, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={i * 10}
                  y={j * 10}
                  width={8}
                  height={8}
                  fill={(i + j) % 3 === 0 ? 'white' : 'transparent'}
                  rx={1}
                />
              ))
            )}
          </svg>
        </div>
        <QrCode size={80} className="text-white relative z-10" />
      </div>

      <p className="font-bold text-slate-800">
        Ticket ID: <span className="text-blue-600">{ticketId}</span>
      </p>
      <p className="text-sm text-slate-500 mt-1">Vehicle: {vehicleNumber}</p>
      {category && <p className="text-sm text-slate-500 mt-1">Category: {category}</p>}
      {(floorName || floorNumber) && (
        <p className="text-sm text-slate-500 mt-1">
          Assigned Floor: {floorName ?? `Floor ${floorNumber}`}
        </p>
      )}
      {slotStatus && <p className="text-sm text-slate-500 mt-1">Slot Status: {slotStatus}</p>}
      <p className="text-sm text-green-600 font-semibold mt-1">Amount Paid: ₹{amount}</p>

      {onPrint && (
        <div className="mt-4">
          <SuccessButton fullWidth onClick={onPrint} data-testid="ticket-print-button">
            Print Ticket
          </SuccessButton>
        </div>
      )}
    </div>
  );
}
