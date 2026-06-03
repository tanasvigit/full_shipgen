import { useIamAbility } from "@/hooks/iam/useIamAbility";

/**
 * Renders children only when IAM ability allows (G-IAM042).
 * @param {{ action: string, resource: string, children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 */
export function IamPermissionGate({ action, resource, children, fallback = null }) {
  const { can } = useIamAbility();
  if (!can(action, resource)) return fallback;
  return children;
}

/**
 * Wraps a control and hides it when the user lacks permission (prefer over disabled for destructive actions).
 */
export function IamIfCan({ action, resource, children }) {
  return (
    <IamPermissionGate action={action} resource={resource}>
      {children}
    </IamPermissionGate>
  );
}
