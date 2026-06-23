import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PlateImageUpload from '../../components/ocr/PlateImageUpload';
import { OccupancySummaryCard } from '../../components/parking';
import {
  TicketPreview,
  StatusBadge,
  FormField,
  TextInput,
  SelectInput,
  PrimaryButton,
  DataTable,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useParkingFloors } from '../../context/ParkingFloorContext';
import type { ParkingTicket, VehicleCategory, EntryType, PaymentMethod } from '../../types';

export default function NewTicketPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const { user } = useAuth();
  const { tickets, facilitySummary, createTicketWithFloor } = useParkingFloors();
  const [vehicleNumber, setVehicleNumber] = useState('AP39AB1234');
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('4 Wheeler');
  const [entryType, setEntryType] = useState<EntryType>('Paid Entry');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [generatedTicket, setGeneratedTicket] = useState<ParkingTicket | null>(null);
  const [error, setError] = useState('');

  const priceMap: Record<VehicleCategory, number> = {
    '2 Wheeler': 20,
    '4 Wheeler': 50,
    'Heavy Vehicles': 100,
  };
  const amount = entryType === 'Free Entry' ? 0 : priceMap[vehicleType];

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const result = await createTicketWithFloor({
      vehicleNumber,
      category: vehicleType,
      amount,
      paymentMethod: entryType === 'Free Entry' ? undefined : paymentMethod,
      entryType,
      operatorId: user?.id ?? 'U002',
    });

    if (!result.ticket) {
      setGeneratedTicket(null);
      setError(result.error ?? 'Unable to assign a parking floor for this vehicle.');
      return;
    }

    setGeneratedTicket(result.ticket);
  };

  const recentColumns = [
    { key: 'id', header: 'Ticket ID' },
    { key: 'vehicleNumber', header: 'Vehicle' },
    { key: 'category', header: 'Category' },
    { key: 'floorName', header: 'Floor' },
    {
      key: 'slotStatus',
      header: 'Slot',
      render: (row: ParkingTicket) => row.slotStatus ?? 'Occupied',
    },
    { key: 'amount', header: 'Amount', render: (row: ParkingTicket) => `₹${row.amount}` },
    {
      key: 'status',
      header: 'Status',
      render: (row: ParkingTicket) => (
        <StatusBadge label={row.status} variant={row.status === 'Paid' ? 'success' : 'warning'} />
      ),
    },
  ];

  return (
    <>
      <Header
        title="New Ticket"
        subtitle="Generate parking tickets and manage payments"
        onToggleSidebar={onToggleSidebar}
      />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="new-ticket-page">
        <OccupancySummaryCard summary={facilitySummary} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h3 className="font-semibold text-lg text-slate-800 mb-5">Create New Parking Ticket</h3>
            <form onSubmit={handleGenerate} className="space-y-4" data-testid="new-ticket-form">
              <FormField label="Vehicle Number" htmlFor="vehicleNumber">
                <TextInput
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(event) => setVehicleNumber(event.target.value.toUpperCase())}
                  placeholder="AP39AB1234"
                  data-testid="vehicle-number-input"
                />
              </FormField>
              <PlateImageUpload onDetected={(plateNumber) => setVehicleNumber(plateNumber.toUpperCase())} />
              <FormField label="Vehicle Type" htmlFor="vehicleType">
                <SelectInput
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value as VehicleCategory)}
                  data-testid="vehicle-type-select"
                >
                  <option>2 Wheeler</option>
                  <option>4 Wheeler</option>
                  <option>Heavy Vehicles</option>
                </SelectInput>
              </FormField>
              <FormField label="Entry Type" htmlFor="entryType">
                <SelectInput
                  id="entryType"
                  value={entryType}
                  onChange={(event) => setEntryType(event.target.value as EntryType)}
                  data-testid="entry-type-select"
                >
                  <option>Paid Entry</option>
                  <option>Free Entry</option>
                </SelectInput>
              </FormField>
              {entryType !== 'Free Entry' && (
                <FormField label="Payment Method" htmlFor="paymentMethod">
                  <SelectInput
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    data-testid="payment-method-select"
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Card</option>
                  </SelectInput>
                </FormField>
              )}
              {error && <p className="text-sm text-red-500" data-testid="new-ticket-error">{error}</p>}
              <PrimaryButton type="submit" data-testid="generate-ticket-button">Generate QR Ticket</PrimaryButton>
            </form>
          </div>

          {generatedTicket && (
            <TicketPreview
              ticketId={generatedTicket.id}
              vehicleNumber={generatedTicket.vehicleNumber}
              amount={generatedTicket.amount}
              category={generatedTicket.category}
              floorName={generatedTicket.floorName}
              floorNumber={generatedTicket.floorNumber}
              slotStatus={generatedTicket.slotStatus}
              onPrint={() => window.print()}
            />
          )}
        </div>

        <DataTable title="Recent Generated Tickets" columns={recentColumns} data={tickets.slice(0, 5)} />
      </main>
    </>
  );
}
