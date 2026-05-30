import { Link } from "react-router-dom";
import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function TelematicsList() {
  return (
    <div data-testid="telematics-module">
      <FleetopsCrudListPage config={CRUD_ENTITIES.telematic} />
      <div className="px-6 pb-6 text-sm text-[#4B5563]">
        <Link to="/fleet-ops/connectivity/devices" className="text-[#0066FF] mr-4">
          Devices
        </Link>
        <Link to="/fleet-ops/connectivity/sensors" className="text-[#0066FF]">
          Sensors
        </Link>
      </div>
    </div>
  );
}
