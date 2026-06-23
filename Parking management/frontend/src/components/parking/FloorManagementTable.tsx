import { useState } from 'react';
import type { ParkingFloor } from '../../types';
import { createCategoryStats } from '../../utils/parkingFloors';
import { PrimaryButton, StatusBadge } from '../ui';

interface FloorManagementTableProps {
  floors: ParkingFloor[];
  canManage: boolean;
  onAddFloor: (floor: Omit<ParkingFloor, 'id' | 'status' | 'floorNumber'> & { floorNumber?: number }) => Promise<void>;
  onUpdateFloor: (floorId: string, updates: Partial<Omit<ParkingFloor, 'id' | 'status'>>) => Promise<void>;
  onRemoveFloor: (floorId: string) => Promise<void>;
}

const emptyDraft = {
  floorName: '',
  twoWheelerCapacity: '0',
  fourWheelerCapacity: '0',
  heavyVehicleCapacity: '0',
};

export default function FloorManagementTable({
  floors,
  canManage,
  onAddFloor,
  onUpdateFloor,
  onRemoveFloor,
}: FloorManagementTableProps) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (floor: ParkingFloor) => {
    setFormError('');
    setEditingFloorId(floor.id);
    setEditDraft({
      floorName: floor.floorName,
      twoWheelerCapacity: String(floor.twoWheeler.capacity),
      fourWheelerCapacity: String(floor.fourWheeler.capacity),
      heavyVehicleCapacity: String(floor.heavyVehicle.capacity),
    });
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage) return;

    setFormError('');
    setIsSubmitting(true);
    try {
      await onAddFloor({
        floorName: draft.floorName.trim() || `Floor ${floors.length + 1}`,
        twoWheeler: createCategoryStats(Number(draft.twoWheelerCapacity), 0),
        fourWheeler: createCategoryStats(Number(draft.fourWheelerCapacity), 0),
        heavyVehicle: createCategoryStats(Number(draft.heavyVehicleCapacity), 0),
      });
      setDraft(emptyDraft);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add floor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (floor: ParkingFloor) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await onUpdateFloor(floor.id, {
        floorName: editDraft.floorName.trim() || floor.floorName,
        twoWheeler: createCategoryStats(Number(editDraft.twoWheelerCapacity), floor.twoWheeler.occupied),
        fourWheeler: createCategoryStats(Number(editDraft.fourWheelerCapacity), floor.fourWheeler.occupied),
        heavyVehicle: createCategoryStats(Number(editDraft.heavyVehicleCapacity), floor.heavyVehicle.occupied),
      });
      setEditingFloorId(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to update floor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (floorId: string) => {
    if (!window.confirm('Remove this floor? Floors with active tickets cannot be deleted.')) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      await onRemoveFloor(floorId);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to remove floor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden" data-testid="floor-management-table-card">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">Parking Floor Management</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {canManage ? 'Configure floor capacities and monitor live occupancy.' : 'Monitor floor capacities and occupancy.'}
          </p>
        </div>
        <p className="text-sm font-medium text-slate-600">{floors.length} floors</p>
      </div>

      {formError ? <p className="px-6 py-3 text-sm text-red-600 border-b border-slate-100">{formError}</p> : null}

      {canManage && (
        <form onSubmit={(event) => void handleAdd(event)} className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-3" data-testid="add-floor-form">
          <input
            value={draft.floorName}
            onChange={(event) => setDraft((current) => ({ ...current, floorName: event.target.value }))}
            placeholder="Floor name"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
            data-testid="floor-name-input"
          />
          <input
            value={draft.twoWheelerCapacity}
            onChange={(event) => setDraft((current) => ({ ...current, twoWheelerCapacity: event.target.value }))}
            placeholder="2W capacity"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
            data-testid="floor-two-wheeler-input"
          />
          <input
            value={draft.fourWheelerCapacity}
            onChange={(event) => setDraft((current) => ({ ...current, fourWheelerCapacity: event.target.value }))}
            placeholder="4W capacity"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
            data-testid="floor-four-wheeler-input"
          />
          <input
            value={draft.heavyVehicleCapacity}
            onChange={(event) => setDraft((current) => ({ ...current, heavyVehicleCapacity: event.target.value }))}
            placeholder="Heavy capacity"
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
            data-testid="floor-heavy-vehicle-input"
          />
          <PrimaryButton disabled={isSubmitting} type="submit" data-testid="add-floor-button">
            {isSubmitting ? 'Adding...' : 'Add Floor'}
          </PrimaryButton>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" data-testid="floor-management-table">
          <thead>
            <tr className="border-b border-slate-100">
              {['Floor', '2W', '4W', 'Heavy', 'Occupied', 'Available', 'Status', ...(canManage ? ['Actions'] : [])].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {floors.map((floor) => {
              const isEditing = editingFloorId === floor.id;
              const totalOccupied =
                floor.twoWheeler.occupied + floor.fourWheeler.occupied + floor.heavyVehicle.occupied;
              const totalAvailable =
                floor.twoWheeler.available + floor.fourWheeler.available + floor.heavyVehicle.available;

              return (
                <tr key={floor.id} className="hover:bg-slate-50/50" data-testid="floor-row">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-800">
                    {isEditing ? (
                      <input
                        value={editDraft.floorName}
                        onChange={(event) => setEditDraft((current) => ({ ...current, floorName: event.target.value }))}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    ) : (
                      `${floor.floorName} (#${floor.floorNumber})`
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        value={editDraft.twoWheelerCapacity}
                        onChange={(event) => setEditDraft((current) => ({ ...current, twoWheelerCapacity: event.target.value }))}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    ) : (
                      `${floor.twoWheeler.occupied}/${floor.twoWheeler.capacity}`
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        value={editDraft.fourWheelerCapacity}
                        onChange={(event) => setEditDraft((current) => ({ ...current, fourWheelerCapacity: event.target.value }))}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    ) : (
                      `${floor.fourWheeler.occupied}/${floor.fourWheeler.capacity}`
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        value={editDraft.heavyVehicleCapacity}
                        onChange={(event) => setEditDraft((current) => ({ ...current, heavyVehicleCapacity: event.target.value }))}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      />
                    ) : (
                      `${floor.heavyVehicle.occupied}/${floor.heavyVehicle.capacity}`
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{totalOccupied}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{totalAvailable}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge
                      label={floor.status}
                      variant={floor.status === 'full' ? 'danger' : floor.status === 'partial' ? 'warning' : 'success'}
                    />
                  </td>
                  {canManage && (
                    <td className="px-6 py-3.5">
                      <div className="flex gap-2">
                        {isEditing ? (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void handleSaveEdit(floor)}
                            className="text-sm font-semibold text-blue-600 disabled:text-slate-400"
                            data-testid="save-floor-button"
                          >
                            {isSubmitting ? 'Saving...' : 'Save'}
                          </button>
                        ) : (
                          <button type="button" onClick={() => startEdit(floor)} className="text-sm font-semibold text-blue-600" data-testid="edit-floor-button">
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleRemove(floor.id)}
                          className="text-sm font-semibold text-red-500 disabled:text-slate-400"
                          data-testid="remove-floor-button"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
