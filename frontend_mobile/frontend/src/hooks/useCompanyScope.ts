import { useAuth } from "@/src/contexts/AuthContext";

/** Tenant scope for query keys and mutations — always use company uuid. */
export function useCompanyScope() {
  const { activeOrganization, user, authReady, isAuthenticated } = useAuth();
  const companyUuid = activeOrganization?.uuid || activeOrganization?.id || null;

  return {
    companyUuid,
    activeOrganization,
    user,
    authReady,
    isAuthenticated,
    enabled: authReady && isAuthenticated && Boolean(companyUuid),
  };
}
