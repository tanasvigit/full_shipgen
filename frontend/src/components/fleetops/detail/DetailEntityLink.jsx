import { useSearchParams } from "react-router-dom";
import { getEntityConfig } from "@/domain/fleetops/detail/registry";

/** Opens another entity drawer via query param (nested navigation). */
export default function DetailEntityLink({ entityKey, entityId, children, className = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const config = getEntityConfig(entityKey);

  if (!entityId || !config) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = new URLSearchParams(searchParams);
        next.set(config.param, String(entityId));
        setSearchParams(next, { replace: false });
      }}
      className={`text-left text-[#0066FF] hover:underline font-medium ${className}`}
    >
      {children}
    </button>
  );
}
