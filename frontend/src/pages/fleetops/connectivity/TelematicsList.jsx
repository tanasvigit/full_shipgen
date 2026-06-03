import { Link } from "react-router-dom";
import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { TelematicsSetupButton } from "@/components/fleetops/telematics/TelematicsSetupWizard";

export default function TelematicsList() {
  return (
    <div data-testid="telematics-module">
      <div className="px-6 pt-4 flex justify-end">
        <TelematicsSetupButton />
      </div>
      <FleetopsCrudListPage config={CRUD_ENTITIES.telematic} />
      <div className="px-6 pb-6 text-sm text-[#4B5563]">
        <Link to="/fleet-ops/connectivity/devices" className="text-[#0066FF] mr-4">
          Devices
        </Link>
        <Link to="/fleet-ops/connectivity/sensors" className="text-[#0066FF] mr-4">
          Sensors
        </Link>
        <Link to="/fleet-ops/connectivity/vehicle-devices" className="text-[#0066FF]">
          Vehicle-devices admin
        </Link>
      </div>
    </div>
  );
}
