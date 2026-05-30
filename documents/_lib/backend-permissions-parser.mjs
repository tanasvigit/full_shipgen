/**
 * Parses Fleetbase Auth/Schemas PHP classes (permission catalog source of truth).
 */

import path from 'node:path';

const CRUD_ACTIONS = ['create', 'update', 'delete', 'view', 'list', 'see'];

function extractPropertyArray(content, propName) {
  const re = new RegExp(`public\\s+array\\s+\\$${propName}\\s*=\\s*\\[`);
  const m = content.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < content.length && depth > 0) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    i++;
  }
  return content.slice(start, i - 1);
}

function splitTopLevelObjects(arrayBody) {
  const blocks = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < arrayBody.length; i++) {
    const ch = arrayBody[i];
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      if (current.trim()) blocks.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) blocks.push(current.trim());
  return blocks.filter((b) => b.startsWith('['));
}

function parseObjectBlock(block) {
  const name = block.match(/'name'\s*=>\s*'([^']+)'/)?.[1] || null;
  const description =
    block.match(/'description'\s*=>\s*'([^']*)'/)?.[1] || null;

  const actionsMatch = block.match(/'actions'\s*=>\s*\[([^\]]*)\]/);
  const actions = actionsMatch
    ? [...actionsMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  const removeMatch = block.match(/'remove_actions'\s*=>\s*\[([^\]]*)\]/);
  const removeActions = removeMatch
    ? [...removeMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  const permissionsMatch = block.match(
    /'permissions'\s*=>\s*\[([\s\S]*?)\n\s*\]/
  );
  const permissions = permissionsMatch
    ? [...permissionsMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  const rolesMatch = block.match(/'roles'\s*=>\s*\[([\s\S]*?)\n\s*\]/);
  const roles = rolesMatch
    ? [...rolesMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  const policiesMatch = block.match(/'policies'\s*=>\s*\[([\s\S]*?)\n\s*\]/);
  const policies = policiesMatch
    ? [...policiesMatch[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  return {
    name,
    description,
    actions,
    removeActions,
    permissions,
    roles,
    policies,
  };
}

/**
 * @param {string} content
 * @param {string} file
 */
export function parseAuthSchemaFile(content, file) {
  const className =
    content.match(/class\s+(\w+)/)?.[1] || path.basename(file, '.php');
  const service =
    content.match(/public\s+string\s+\$name\s*=\s*'([^']+)'/)?.[1] || null;
  const policyName =
    content.match(/public\s+string\s+\$policyName\s*=\s*'([^']+)'/)?.[1] ||
    null;

  const schemaPermsBody = extractPropertyArray(content, 'permissions');
  const schemaPermissions = schemaPermsBody
    ? [...schemaPermsBody.matchAll(/'([^']+)'/g)].map((x) => x[1])
    : [];

  const resourcesBody = extractPropertyArray(content, 'resources');
  const resources = resourcesBody
    ? splitTopLevelObjects(resourcesBody)
        .map(parseObjectBlock)
        .filter((r) => r.name)
    : [];

  const policiesBody = extractPropertyArray(content, 'policies');
  const policies = policiesBody
    ? splitTopLevelObjects(policiesBody)
        .map(parseObjectBlock)
        .filter((p) => p.name)
    : [];

  const rolesBody = extractPropertyArray(content, 'roles');
  const roles = rolesBody
    ? splitTopLevelObjects(rolesBody)
        .map(parseObjectBlock)
        .filter((r) => r.name)
    : [];

  return {
    className,
    file,
    service,
    policyName,
    schemaPermissions,
    resources,
    policies,
    roles,
  };
}

/** Expand resource to standard + custom permission name patterns (matches CreatePermissions). */
export function expandResourcePermissions(
  service,
  resourceName,
  actions,
  removeActions
) {
  const effectiveCrud = CRUD_ACTIONS.filter((a) => !removeActions.includes(a));
  const names = new Set();

  names.add(`${service} see extension`);
  names.add(`${service} *`);
  names.add(`${service} * ${resourceName}`);

  for (const action of effectiveCrud) {
    names.add(`${service} ${action} ${resourceName}`);
  }
  for (const action of actions) {
    names.add(`${service} ${action} ${resourceName}`);
  }

  return [...names].sort();
}

export function buildPermissionCatalogFromFiles(schemaFiles, directiveFiles, readSafe) {
  const schemas = schemaFiles
    .map((file) => {
      const content = readSafe(file);
      if (!content) return null;
      const parsed = parseAuthSchemaFile(content, file);
      parsed.generatedPermissionCount = parsed.resources.reduce(
        (n, r) =>
          n +
          expandResourcePermissions(
            parsed.service,
            r.name,
            r.actions,
            r.removeActions
          ).length,
        0
      );
      return parsed;
    })
    .filter(Boolean);

  const directives = directiveFiles.map((file) => ({
    className: path.basename(file, '.php'),
    file,
  }));

  return { schemas, directives };
}

export const ACTION_MAPPER_CRUD = {
  createRecord: 'create',
  updateRecord: 'update',
  deleteRecord: 'delete',
  findRecord: 'view',
  queryRecord: 'list',
  searchRecords: 'list',
  search: 'list',
};

export const ACTION_MAPPER_HTTP = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
  GET: 'view',
};
