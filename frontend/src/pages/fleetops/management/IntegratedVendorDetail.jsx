import { useCallback, useEffect, useState } from "react";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { fleetopsService } from "@/services/fleetops";
import DataTable from "@/components/common/DataTable";

function IntegratedVendorProvidersPanel() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listIntegratedVendorProviders();
      setProviders(Array.isArray(rows) ? rows : rows?.providers || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-4" data-testid="integrated-vendor-providers-panel">
      <div className="overline mb-2">Supported providers</div>
      <DataTable
        testid="integrated-vendor-providers-table"
        columns={[
          { key: "name", header: "Provider", render: (r) => r.name || r.id || r.provider || "—" },
          { key: "status", header: "Status", render: (r) => r.status || "—" },
        ]}
        data={providers.map((p, i) => ({ id: p.id || i, ...p }))}
        loading={loading}
        pageSize={10}
        emptyMessage="No providers returned from API"
      />
    </div>
  );
}

export default function IntegratedVendorDetail() {
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.integratedVendor}
      relationSlots={<IntegratedVendorProvidersPanel />}
    />
  );
}
