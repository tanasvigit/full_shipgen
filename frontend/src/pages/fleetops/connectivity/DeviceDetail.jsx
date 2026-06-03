import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeviceEventsPanel from "@/components/fleetops/device/DeviceEventsPanel";
import DeviceVehiclePanel from "@/components/fleetops/device/DeviceVehiclePanel";
import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";

export default function DeviceDetail() {
  const { id } = useParams();
  const [deviceApi, setDeviceApi] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setDeviceApi(await fleetopsService.getDevice(id));
    } catch {
      setDeviceApi(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div data-testid="device-detail-module">
      <FleetopsCrudDetailPage config={CRUD_ENTITIES.device} />
      <div className="px-6 pb-8 space-y-4">
        <DeviceVehiclePanel deviceId={id} deviceApi={deviceApi} />
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events" data-testid="device-tab-events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="events">
            <DeviceEventsPanel deviceId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
