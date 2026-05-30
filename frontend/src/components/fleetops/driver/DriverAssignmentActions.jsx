import { useState } from "react";
import { Button } from "@/components/ui/button";
import AssignOrderToDriverDialog from "./AssignOrderToDriverDialog";
import AssignVehicleToDriverDialog from "./AssignVehicleToDriverDialog";
import AssignVendorToDriverDialog from "./AssignVendorToDriverDialog";

export default function DriverAssignmentActions({ driverId, driverName }) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2" data-testid="driver-assignment-actions">
      <Button variant="outline" size="sm" onClick={() => setOrderOpen(true)} data-testid="driver-assign-order">
        Assign order
      </Button>
      <Button variant="outline" size="sm" onClick={() => setVehicleOpen(true)} data-testid="driver-assign-vehicle">
        Assign vehicle
      </Button>
      <Button variant="outline" size="sm" onClick={() => setVendorOpen(true)} data-testid="driver-assign-vendor">
        Assign vendor
      </Button>
      <AssignOrderToDriverDialog open={orderOpen} onOpenChange={setOrderOpen} driverId={driverId} driverName={driverName} />
      <AssignVehicleToDriverDialog open={vehicleOpen} onOpenChange={setVehicleOpen} driverId={driverId} />
      <AssignVendorToDriverDialog open={vendorOpen} onOpenChange={setVendorOpen} driverId={driverId} />
    </div>
  );
}
