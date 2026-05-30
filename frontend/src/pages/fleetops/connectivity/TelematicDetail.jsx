import { Link, useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TelematicDevicesTab() {
  return (
    <div className="p-4" data-testid="telematic-devices-tab">
      <p className="text-sm text-[#4B5563] mb-3">Devices linked to this telematics provider.</p>
      <Link to="/fleet-ops/connectivity/devices" className="text-[#0066FF] text-sm">
        Open devices module →
      </Link>
    </div>
  );
}

function TelematicSensorsTab() {
  return (
    <div className="p-4" data-testid="telematic-sensors-tab">
      <Link to="/fleet-ops/connectivity/sensors" className="text-[#0066FF] text-sm">
        Open sensors module →
      </Link>
    </div>
  );
}

export default function TelematicDetail() {
  const { id } = useParams();
  return (
    <div data-testid="telematic-detail-module">
      <FleetopsCrudDetailPage config={CRUD_ENTITIES.telematic} />
      <div className="px-6 pb-8">
        <Tabs defaultValue="devices">
          <TabsList>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
          </TabsList>
          <TabsContent value="devices">
            <TelematicDevicesTab telematicId={id} />
          </TabsContent>
          <TabsContent value="sensors">
            <TelematicSensorsTab telematicId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
