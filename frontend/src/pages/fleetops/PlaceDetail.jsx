import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailDrawerTabs from "@/components/fleetops/detail/DetailDrawerTabs";
import PlaceOrdersTab from "@/components/fleetops/detail/tabs/place/PlaceOrdersTab";
import PlaceActivityTab from "@/components/fleetops/detail/tabs/place/PlaceActivityTab";
import PlaceCommentsTab from "@/components/fleetops/detail/tabs/place/PlaceCommentsTab";
import PlaceDocumentsTab from "@/components/fleetops/detail/tabs/place/PlaceDocumentsTab";
import PlaceRulesTab from "@/components/fleetops/detail/tabs/place/PlaceRulesTab";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import { DetailLoadingState, resolveDetailEntityId, wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import PlaceForm, { placeValuesFromApi } from "@/components/fleetops/forms/PlaceForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, Phone, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { fleetopsService } from "@/services/fleetops";
import { mapPlaceRow } from "@/lib/mappers";

export default function PlaceDetail({
  embedded = false,
  entityId: entityIdProp,
  activeTab: activeTabProp,
  onTabChange,
}) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const tabActive = (tab) => (activeTabProp || "overview") === tab;
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);
  const [placeApi, setPlaceApi] = useState(null);
  const formRef = useFormRef();
  const editDialog = useFleetopsFormDialog({
    formRef,
    suspendDrawer: embedded,
    successMessage: "Place updated",
    onSubmit: async (values) => {
      const updated = await fleetopsService.updatePlace(id, values);
      setPlaceApi(updated);
      setPlace(mapPlaceRow(updated));
      return updated;
    },
  });

  useFormDirtyBridge(formRef, editDialog.open, "place-edit");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = await fleetopsService.getPlace(id);
      setPlaceApi(raw || null);
      setPlace(raw ? mapPlaceRow(raw) : null);
    } catch (err) {
      if (err?.response?.status === 404) toast.error("Place not found.");
      else toast.error(err?.friendlyMessage || "Could not load place.");
      setPlace(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !place) {
    return <div className="p-8 text-[#374151]">Place not found.</div>;
  }
  if (loading && !place) {
    return (
      <DetailLoadingState embedded={embedded} message="Loading place…" testId="place-detail-loader" />
    );
  }

  const p = place;
  const lat = Number(p.lat) || 0;
  const lng = Number(p.lng) || 0;

  const mapBlock = (
    <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
      <div className={embedded ? "h-[320px]" : "h-[480px]"}>
        <MapView
          markers={[{ id: p.id, lat, lng, label: p.name, popup: p.address, color: "#06B6D4" }]}
          geofence={{ lat, lng, radius: 250 }}
          zoom={lat && lng ? 15 : 10}
          testid="place-map"
        />
      </div>
    </div>
  );

  const sidebar = (
    <aside className="space-y-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3">
        <div className="overline">Address</div>
        <div className="flex items-start gap-2 text-sm text-[#1F2937]">
          <MapPin className="h-4 w-4 mt-0.5 text-[#4B5563]" /> {p.address}
        </div>
        <div className="font-mono text-xs text-[#4B5563]">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3">
        <div className="overline">Contact</div>
        <div className="flex items-center gap-2 text-sm text-[#1F2937]">
          <Phone className="h-4 w-4 text-[#4B5563]" /> {p.phone || "—"}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#1F2937]">
          <Clock className="h-4 w-4 text-[#4B5563]" /> {p.openingHours || "—"}
        </div>
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md p-4">
        <div className="overline mb-2">Public ID</div>
        <div className="font-mono text-xs text-[#1F2937]">{p.publicId}</div>
      </div>
    </aside>
  );

  const drawerBody = embedded ? (
    <>
      <DetailDrawerHeader
        overline={`Place · ${String(p.type || "").replace(/_/g, " ")}`}
        title={p.name}
        publicId={p.publicId}
        onEdit={embedded ? editDialog.openEdit : () => editDialog.setOpen(true)}
        editTestId="place-edit"
      />
      <DetailDrawerTabs
        value={activeTabProp || "overview"}
        onValueChange={onTabChange}
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="p-4 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                {mapBlock}
                {sidebar}
              </div>
            ),
          },
          { id: "map", label: "Map", content: <div className="p-4">{mapBlock}</div> },
          {
            id: "orders",
            label: "Orders",
            content: <PlaceOrdersTab placeId={id} enabled={tabActive("orders")} />,
          },
          {
            id: "contacts",
            label: "Contacts",
            content: (
              <div className="p-4 text-sm text-[#374151] bg-white border border-black/[0.08] rounded-md m-4">
                Contact: {p.phone || "—"} · Linked vendors load from place relationships when configured.
              </div>
            ),
          },
          {
            id: "comments",
            label: "Comments",
            content: <PlaceCommentsTab placeId={id} enabled={tabActive("comments")} />,
          },
          {
            id: "documents",
            label: "Documents",
            content: <PlaceDocumentsTab placeId={id} enabled={tabActive("documents")} />,
          },
          {
            id: "rules",
            label: "Rules",
            content: <PlaceRulesTab placeId={id} enabled={tabActive("rules")} />,
          },
          {
            id: "activity",
            label: "Activity",
            content: <PlaceActivityTab placeId={id} enabled={tabActive("activity")} />,
          },
        ]}
      />
      {wrapDetailEditDialog(
        embedded,
        editDialog.open,
        <FleetOpsFormDialog
          detached={embedded}
          open={editDialog.open}
          onOpenChange={editDialog.setOpen}
          title="Edit place"
          description="Updates address, hours, dock code, and coordinates."
          submitLabel="Save changes"
          busy={editDialog.busy}
          error={editDialog.error}
          onSubmit={editDialog.handleSubmit}
          testId="edit-place-dialog"
          size="lg"
        >
          {editDialog.open && (
            <PlaceForm key={`place-edit-${id}`} ref={formRef} formId="place-edit-form" initialValues={placeValuesFromApi(placeApi)} />
          )}
        </FleetOpsFormDialog>,
      )}
    </>
  ) : null;

  if (embedded) {
    return <div data-testid="place-detail-page">{drawerBody}</div>;
  }

  return (
    <div data-testid="place-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Places", to: "/fleet-ops/management/places" },
          { label: p.name },
        ]}
        overline={`Place · ${String(p.type || "").replace(/_/g, " ")}`}
        title={p.name}
        description={p.address}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => editDialog.setOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="place-edit">
              <Edit3 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        {mapBlock}
        {sidebar}
      </div>
      <FleetOpsFormDialog
        open={editDialog.open}
        onOpenChange={editDialog.setOpen}
        title="Edit place"
        description="Updates address, hours, dock code, and coordinates."
        submitLabel="Save changes"
        busy={editDialog.busy}
        error={editDialog.error}
        onSubmit={editDialog.handleSubmit}
        testId="edit-place-dialog"
        size="lg"
      >
        {editDialog.open && (
          <PlaceForm key={`place-edit-${id}`} ref={formRef} formId="place-edit-form" initialValues={placeValuesFromApi(placeApi)} />
        )}
      </FleetOpsFormDialog>
    </div>
  );
}
