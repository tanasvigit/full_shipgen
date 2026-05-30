/**
 * Authorization directives: DB rules JSON + DirectiveParser behavior.
 */

import { walkPhpFiles } from './backend-php-utils.mjs';

const PARSER_BEHAVIOR = [
  {
    mechanism: 'where / orWhere',
    description: 'Column constraints; supports session.* and self.* placeholders',
    example: `['where', 'company_uuid', 'session.company']`,
  },
  {
    mechanism: 'whereHas',
    description: 'Nested relation filter with qualified columns',
    example: `['whereHas', 'orders', ['where', 'status', 'active']]`,
  },
  {
    mechanism: 'Directive class',
    description: 'FQCN implementing Fleetbase\\Contracts\\Directive',
    example: `['Fleetbase\\\\Auth\\\\Directives\\\\...', ...]`,
  },
];

const TENANCY_RULES = [
  {
    scope: 'Company isolation',
    constraint: 'company_uuid = session company (SetupFleetbaseSession)',
    applies: 'Nearly all internal list/query via HasApiModelBehavior',
  },
  {
    scope: 'Sandbox',
    constraint: 'SANDBOX_DB_CONNECTION for test API keys',
    applies: 'ApiCredential sandbox flag → alternate DB connection',
  },
  {
    scope: 'Directive rules',
    constraint: 'JSON rules on directives table per permission/role/policy',
    applies: 'applyDirectivesToQuery() before filters',
  },
  {
    scope: 'session.* placeholder',
    constraint: 'Resolves to Session::get(key)',
    applies: 'DirectiveParser::parseParameters',
  },
  {
    scope: 'self.* placeholder',
    constraint: 'Resolves to Auth::user()->attribute',
    applies: 'DirectiveParser::parseParameters',
  },
];

/**
 * Parse seed/migration examples of directive rules if present in PHP strings.
 * @param {(p: string) => string|null} readSafe
 * @param {string} repoRoot
 */
export function buildAuthDirectiveCatalog(readSafe, repoRoot) {
  const directiveRows = [];
  const migrations = walkPhpFiles(repoRoot, 'packages/core-api/migrations').filter((f) =>
    f.includes('directive')
  );

  for (const rel of migrations) {
    const content = readSafe(rel);
    if (!content) continue;
    const rulesMatch = content.match(/'rules'\s*=>\s*'(\[[^\]]+\])'/);
    if (rulesMatch) {
      directiveRows.push({
        key: 'migration example',
        rules: rulesMatch[1],
        source: rel,
      });
    }
  }

  // Common patterns from Auth schema permissions (documented examples)
  const examples = [
    {
      directive: 'Row-level via permission directives',
      queryConstraints: 'where company_uuid = session.company',
      scope: 'Internal REST queryRecord',
    },
    {
      directive: 'Customer-scoped orders (example pattern)',
      queryConstraints: 'where customer_uuid = Auth user linked customer',
      scope: 'When directive rules attached to role',
    },
    {
      directive: 'Fleet-ops service wildcard',
      queryConstraints: 'permission fleet-ops * {resource}',
      scope: 'AuthorizationGuard before query',
    },
  ];

  return {
    parserBehavior: PARSER_BEHAVIOR,
    tenancyRules: TENANCY_RULES,
    storedDirectiveExamples: directiveRows,
    documentedExamples: examples,
    applyOrder: [
      '1. SetupFleetbaseSession binds company + permissions',
      '2. AuthorizationGuard checks action permission',
      '3. applyDirectivesToQuery() applies directive JSON rules',
      '4. Http Filter applies query-string filters',
    ],
    stats: {
      parserMechanisms: PARSER_BEHAVIOR.length,
      tenancyRules: TENANCY_RULES.length,
    },
  };
}
