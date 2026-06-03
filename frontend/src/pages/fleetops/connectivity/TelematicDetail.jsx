import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TelematicLinkedDevicesPanel from "@/components/fleetops/telematics/TelematicLinkedDevicesPanel";

export default function TelematicDetail() {
  const { id } = useParams();
  return (
    <div data-testid="telematic-detail-module">
      <FleetopsCrudDetailPage config={CRUD_ENTITIES.telematic} />
      <div className="px-6 pb-8">
        <Tabs defaultValue="devices">
          <TabsList>
            <TabsTrigger value="devices" data-testid="telematic-tab-devices">Linked devices</TabsTrigger>
          </TabsList>
          <TabsContent value="devices">
            <TelematicLinkedDevicesPanel telematicId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
