import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeviceEventsPanel from "@/components/fleetops/device/DeviceEventsPanel";
import DeviceVehiclePanel from "@/components/fleetops/device/DeviceVehiclePanel";
import { DeviceForm, deviceValuesFromApi } from "@/components/fleetops/forms/connectivity/ConnectivityForms";
import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

export default function DeviceDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const [deviceApi, setDeviceApi] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleDeviceChange = useCallback(async () => {
    await load();
    setRefreshKey((key) => key + 1);
  }, [load]);

  return (
    <div data-testid="device-detail-module">
      <FleetopsCrudDetailPage
        key={refreshKey}
        embedded={embedded}
        entityId={id}
        onClose={onClose}
        config={CRUD_ENTITIES.device}
        FormComponent={DeviceForm}
        valuesFromApi={deviceValuesFromApi}
      />
      <div className={`${embedded ? "px-4 pb-6" : "px-6 pb-8"} space-y-4`}>
        <DeviceVehiclePanel deviceId={id} deviceApi={deviceApi} onDeviceChange={handleDeviceChange} />
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
