import { Navigate, useParams } from "react-router-dom";
import { getEntityConfig } from "@/domain/fleetops/detail/registry";

/** Legacy /:id detail routes → list path with ?entity=id for drawer deep links. */
export default function DetailRouteRedirect({ entityKey }) {
  const { id } = useParams();
  const config = getEntityConfig(entityKey);

  if (!config) {
    return <Navigate to="/fleet-ops" replace />;
  }

  if (!id) {
    return <Navigate to={config.basePath} replace />;
  }

  const search = new URLSearchParams({ [config.param]: id });
  return <Navigate to={`${config.basePath}?${search.toString()}`} replace />;
}
