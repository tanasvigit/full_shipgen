import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as floorsApi from '../api/floors';
import * as ticketsApi from '../api/tickets';
import { useAuth } from './AuthContext';
import type { FacilityOccupancySummary, ParkingFloor, ParkingTicket, VehicleCategory } from '../types';
import { createCategoryStats } from '../utils/parkingFloors';

interface CreateTicketInput {
  vehicleNumber: string;
  category: VehicleCategory;
  amount: number;
  paymentMethod?: ParkingTicket['paymentMethod'];
  entryType: ParkingTicket['entryType'];
  operatorId: string;
}

interface ParkingFloorContextValue {
  floors: ParkingFloor[];
  tickets: ParkingTicket[];
  facilitySummary: FacilityOccupancySummary;
  isLoading: boolean;
  reload: () => Promise<void>;
  addFloor: (floor: Omit<ParkingFloor, 'id' | 'status' | 'floorNumber'> & { floorNumber?: number }) => Promise<void>;
  updateFloor: (floorId: string, updates: Partial<Omit<ParkingFloor, 'id' | 'status'>>) => Promise<void>;
  removeFloor: (floorId: string) => Promise<void>;
  createTicketWithFloor: (input: CreateTicketInput) => Promise<{ ticket: ParkingTicket | null; error?: string }>;
}

const emptySummary: FacilityOccupancySummary = {
  totalFloors: 0,
  totalCapacity: 0,
  totalOccupied: 0,
  totalAvailable: 0,
  occupancyPercent: 0,
  twoWheeler: createCategoryStats(0, 0),
  fourWheeler: createCategoryStats(0, 0),
  heavyVehicle: createCategoryStats(0, 0),
};

const ParkingFloorContext = createContext<ParkingFloorContextValue | null>(null);

export function ParkingFloorProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [floors, setFloors] = useState<ParkingFloor[]>([]);
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [facilitySummary, setFacilitySummary] = useState<FacilityOccupancySummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setFloors([]);
      setTickets([]);
      setFacilitySummary(emptySummary);
      return;
    }

    setIsLoading(true);
    try {
      const [nextFloors, nextSummary, nextTickets] = await Promise.all([
        floorsApi.listFloors(),
        floorsApi.getFacilitySummary(),
        ticketsApi.listTickets(),
      ]);
      setFloors(nextFloors);
      setFacilitySummary(nextSummary);
      setTickets(nextTickets);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addFloor = useCallback(
    async (floor: Omit<ParkingFloor, 'id' | 'status' | 'floorNumber'> & { floorNumber?: number }) => {
      await floorsApi.createFloor({
        floorName: floor.floorName,
        twoWheeler: { capacity: floor.twoWheeler.capacity, occupied: floor.twoWheeler.occupied },
        fourWheeler: { capacity: floor.fourWheeler.capacity, occupied: floor.fourWheeler.occupied },
        heavyVehicle: { capacity: floor.heavyVehicle.capacity, occupied: floor.heavyVehicle.occupied },
      });
      await reload();
    },
    [reload],
  );

  const updateFloor = useCallback(
    async (floorId: string, updates: Partial<Omit<ParkingFloor, 'id' | 'status'>>) => {
      await floorsApi.updateFloor(floorId, {
        floorNumber: updates.floorNumber,
        floorName: updates.floorName,
        twoWheeler: updates.twoWheeler
          ? { capacity: updates.twoWheeler.capacity, occupied: updates.twoWheeler.occupied }
          : undefined,
        fourWheeler: updates.fourWheeler
          ? { capacity: updates.fourWheeler.capacity, occupied: updates.fourWheeler.occupied }
          : undefined,
        heavyVehicle: updates.heavyVehicle
          ? { capacity: updates.heavyVehicle.capacity, occupied: updates.heavyVehicle.occupied }
          : undefined,
      });
      await reload();
    },
    [reload],
  );

  const removeFloor = useCallback(
    async (floorId: string) => {
      await floorsApi.deleteFloor(floorId);
      await reload();
    },
    [reload],
  );

  const createTicketWithFloor = useCallback(
    async (input: CreateTicketInput) => {
      try {
        const payNow = input.entryType !== 'Free Entry' && input.amount > 0;
        const ticket = await ticketsApi.createTicket({
          vehicleNumber: input.vehicleNumber,
          category: input.category,
          entryType: input.entryType,
          ...(input.entryType === 'Free Entry' ? {} : { paymentMethod: input.paymentMethod }),
          pay_now: payNow,
        });
        await reload();
        return { ticket };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create ticket.';
        return { ticket: null, error: message };
      }
    },
    [reload],
  );

  return (
    <ParkingFloorContext.Provider
      value={{
        floors,
        tickets,
        facilitySummary,
        isLoading,
        reload,
        addFloor,
        updateFloor,
        removeFloor,
        createTicketWithFloor,
      }}
    >
      {children}
    </ParkingFloorContext.Provider>
  );
}

export function useParkingFloors(): ParkingFloorContextValue {
  const context = useContext(ParkingFloorContext);
  if (!context) {
    throw new Error('useParkingFloors must be used within ParkingFloorProvider');
  }

  return context;
}
