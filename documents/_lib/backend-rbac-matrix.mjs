/**
 * RBAC matrix from Auth Schemas (extends permissions parser).
 */

import { expandResourcePermissions } from './backend-permissions-parser.mjs';

/**
 * @param {ReturnType<import('./backend-permissions-parser.mjs').buildPermissionCatalogFromFiles>} catalogs
 */
export function buildRbacMatrix(catalogs) {
  const rows = [];

  for (const schema of catalogs) {
    for (const resource of schema.resources || []) {
      const actions = [
        ...new Set([
          ...(resource.actions || []),
          'create',
          'update',
          'delete',
          'list',
          'view',
        ]),
      ].filter((a) => !(resource.removeActions || []).includes(a));

      const roles =
        Array.isArray(resource.roles) && resource.roles.length
          ? resource.roles
          : ['*'];
      for (const role of roles) {
        for (const action of actions.slice(0, 12)) {
          rows.push({
            service: schema.service,
            role,
            resource: resource.name,
            actions: action,
            permissions: expandResourcePermissions(
              schema.service,
              resource.name,
              resource.actions || [],
              resource.removeActions || []
            )
              .filter((p) => p.includes(` ${action} `))
              .join(', '),
          });
        }
      }
    }

    for (const perm of (schema.schemaPermissions || []).slice(0, 30)) {
      rows.push({
        service: schema.service,
        role: '(schema-level)',
        resource: '—',
        actions: perm,
        permissions: perm,
      });
    }
  }

  return {
    rows: rows.sort(
      (a, b) =>
        a.service.localeCompare(b.service) ||
        a.resource.localeCompare(b.resource)
    ),
    stats: {
      matrixRows: rows.length,
      schemas: catalogs.length,
    },
  };
}
