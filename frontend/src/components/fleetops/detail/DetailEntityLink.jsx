import { useNavigate, useSearchParams } from "react-router-dom";
import { getEntityConfig } from "@/domain/fleetops/detail/registry";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

/** Opens another entity drawer via query param, or navigates to CRUD detail page. */
export default function DetailEntityLink({ entityKey, entityId, children, className = "" }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const drawerConfig = getEntityConfig(entityKey);
  const crudConfig = CRUD_ENTITIES[entityKey];

  if (!entityId) {
    return <span className={className}>{children}</span>;
  }

  if (drawerConfig) {
    return (
      <button
        type="button"
        onClick={() => {
          const next = new URLSearchParams(searchParams);
          next.set(drawerConfig.param, String(entityId));
          setSearchParams(next, { replace: false });
        }}
        className={`text-left text-[#0066FF] hover:underline font-medium ${className}`}
      >
        {children}
      </button>
    );
  }

  if (crudConfig?.listPath) {
    return (
      <button
        type="button"
        onClick={() => navigate(`${crudConfig.listPath}/${entityId}`)}
        className={`text-left text-[#0066FF] hover:underline font-medium ${className}`}
      >
        {children}
      </button>
    );
  }

  return <span className={className}>{children}</span>;
}
