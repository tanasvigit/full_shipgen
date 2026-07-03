import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TelematicLinkedDevicesPanel from "@/components/fleetops/telematics/TelematicLinkedDevicesPanel";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

export default function TelematicDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  return (
    <div data-testid="telematic-detail-module">
      <FleetopsCrudDetailPage
        embedded={embedded}
        entityId={id}
        onClose={onClose}
        config={CRUD_ENTITIES.telematic}
      />
      <div className={embedded ? "px-4 pb-6" : "px-6 pb-8"}>
        <Tabs defaultValue="devices">
          <TabsList>
            <TabsTrigger value="devices" data-testid="telematic-devices-tab">Linked devices</TabsTrigger>
          </TabsList>
          <TabsContent value="devices">
            <TelematicLinkedDevicesPanel telematicId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
