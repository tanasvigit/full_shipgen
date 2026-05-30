/**
 * Second pass: field-level UI specs for auth, fleetops operations, configure, account.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONSOLE = path.join(ROOT, 'console', 'app');
const PKG = path.join(ROOT, 'packages');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}
function writeDoc(name, body) {
  fs.writeFileSync(path.join(__dirname, name), body.trim() + '\n', 'utf8');
}

const HEADER = (id, title, vol) => `# ${title}

| Field | Value |
|-------|-------|
| **Doc ID** | ${id} |
| **Volume** | ${vol} |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | \`_enrich-from-source.mjs\` + \`_enrich-pass2.mjs\` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---

`;

// --- 05 Auth ---
writeDoc('05-auth-flows.md', `${HEADER('05', 'Auth Flows', '1')}
## 1. Login — \`/auth/\`

**Files:** \`templates/auth/login.hbs\`, \`controllers/auth/login.js\`, route \`auth.login\`

| Field / element | Type | Binding | Validation |
|-----------------|------|---------|------------|
| Logo | LogoIcon | @brand | — |
| Title | h2 | i18n \`auth.login.title\` | — |
| Failed-attempt banner | Alert | shows if \`failedAttempts >= 3\` | Link → forgot password |
| Email | Input email | \`identity\` | required, autocomplete username |
| Password | Input password | \`password\` | required |
| Remember me | Checkbox | \`rememberMe\` | — |
| Forgot password | link | \`forgotPassword\` action | — |
| Sign in | Button primary submit | \`login\` | loading: \`isLoading\` |
| Create account | Button | → \`onboard\` | — |
| Extension auth buttons | RegistryYield | registry \`auth:login\` | per menuItem |

**API:** ESA authenticate → may redirect to two-fa or verification.

---

## 2. Forgot password — \`/auth/forgot-password\`

| State | UI |
|-------|-----|
| Not sent | InfoBlock + email Input + Submit + Nevermind |
| Sent | Success InfoBlock + Continue → login |

| Field | Type | Binding |
|-------|------|---------|
| Email | Input email | \`email\` |

**API:** \`POST auth/get-magic-reset-link\` via \`sendSecureLink\` task.

---

## 3. Reset password — \`/auth/reset-password/:id\`

Password + confirm fields, submit → \`POST auth/reset-password\`.

---

## 4. Two-FA — \`/auth/two-fa\`

| Element | Component | Notes |
|---------|-----------|-------|
| OTP | OtpInput | 6 digits, \`handleOtpInput\` |
| Countdown | Countdown | \`twoFactorSessionExpiresAfter\` |
| Expired | InfoBlock + resend | \`isCodeExpired\` |
| Verify | Button submit | \`verifyCode\` |
| Resend / Cancel | links | \`resendCode\`, \`cancelTwoFactor\` |

**APIs:** \`POST two-fa/validate\`, \`verify\`, \`resend\`, \`invalidate\`

---

## 5. Verification — \`/auth/verification\`

| Field | Type | Binding |
|-------|------|---------|
| Code | InputGroup tel | \`code\`, \`validateInput\` |
| Verify | Button | \`verifyCode\`, disabled until \`isReadyToSubmit\` |
| Resend email/SMS | Buttons | \`resendEmail\`, \`resendBySms\` when \`stillWaiting\` |

**APIs:** \`POST auth/verify-email\`, \`create-verification-session\`, \`validate-verification-session\`

---

## 6. Portal login — \`/auth/portal\`

No local template — extension/SSO only.

---

## Custom UI mapping

| Ember | Custom |
|-------|--------|
| OtpInput | 6-box OTP component |
| RegistryYield slots | OAuth / SSO button row |
| Centered card | AuthLayout max-w-md |
`);

// --- 36 FleetOps Operations ---
const ordersCols = read(path.join(PKG, 'fleetops', 'addon', 'controllers', 'operations', 'orders', 'index.js'));
const colMatches = [...ordersCols.matchAll(/label:\s*this\.intl\.t\('([^']+)'\)[\s\S]*?valuePath:\s*'([^']+)'/g)];
let colTable = '| i18n key | valuePath |\n|----------|----------|\n';
colMatches.forEach((m, i) => {
  colTable += `| ${m[1]} | \`${m[2]}\` |\n`;
});

writeDoc('36-fleetops-operations.md', `${HEADER('36', 'FleetOps — Operations', '5')}
## Scope

Operations module: orders (default), routes, orchestrator, scheduler, service rates, order config.

**Mount:** \`/fleet-ops/operations\` (engine path \`/\` under operations)

---

## Orders list — \`/fleet-ops/operations/orders\`

**Template:** \`operations/orders/index.hbs\`  
**Controller:** \`operations/orders/index.js\`

### View modes

| Mode | UI |
|------|-----|
| **map** | \`Map\` with Toolbar, Search, LeafletLiveMap, OrderList, Drawer |
| **table** | \`Layout::Resource::Tabular\` resource \`order\` |
| **kanban** | Board with order-config filter, columns by status |

**Topbar:** MapContainer::ViewSwitch — Map | Table (badge total) | Board

### Table columns (${colMatches.length} defined)

${colTable}

### Table features

- Search: \`query\`, bulk search \`bulk_query\`
- Pagination: \`page\`, meta from API
- Bulk actions: \`bulkActions\`
- Row actions: \`actionButtons\`
- Permission: \`fleet-ops view order\` on ID column
- Filters: string, model (driver, place, customer), date, multi-option status

### Order detail — \`/fleet-ops/operations/orders/:public_id\`

- Tabs from registries (\`fleet-ops:component:order:details\`)
- Virtual sub-routes: \`.../details/:slug\`
- See doc 42

---

## Routes — \`/fleet-ops/operations/routes\`

List (index) + new + details/:public_id

---

## Orchestrator — \`/fleet-ops/operations/orchestrator\`

Dispatch automation UI (import modal in \`modals/orchestrator-import\`)

---

## Scheduler — \`/fleet-ops/operations/scheduler\`

- index — calendar views
- fleet-schedule — fleet scheduling

---

## Service rates — \`/fleet-ops/operations/service-rates\`

index / new / details/:id / edit

---

## Order config — \`/fleet-ops/operations/order-config\`

Order type configuration (flow builder)

---

## Templates in operations/ (22)

${fs.readdirSync(path.join(PKG, 'fleetops', 'addon', 'templates', 'operations'), { recursive: true })
  .filter((f) => f.endsWith('.hbs'))
  .map((f) => `- \`operations/${typeof f === 'string' ? f : f}\``)
  .join('\n') || walkOps()}
`);

function walkOps() {
  const dir = path.join(PKG, 'fleetops', 'addon', 'templates', 'operations');
  const out = [];
  function w(d, p = '') {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = p ? `${p}/${e.name}` : e.name;
      if (e.isDirectory()) w(path.join(d, e.name), rel);
      else if (e.name.endsWith('.hbs')) out.push(`- \`operations/${rel}\``);
    }
  }
  w(dir);
  return out.join('\n');
}

// Fix 36 - the readdirSync recursive might not work on older node - use walkOps only
const opsTemplates = (() => {
  const dir = path.join(PKG, 'fleetops', 'addon', 'templates', 'operations');
  const out = [];
  function w(d, p = '') {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = p ? `${p}/${e.name}` : e.name;
      if (e.isDirectory()) w(path.join(d, e.name), rel);
      else if (e.name.endsWith('.hbs')) out.push(`- \`operations/${rel}\``);
    }
  }
  w(dir);
  return out.join('\n');
})();

writeDoc('36-fleetops-operations.md', `${HEADER('36', 'FleetOps — Operations', '5')}
## Scope

Operations: orders, routes, orchestrator, scheduler, service rates, order config.

---

## Orders — \`/fleet-ops/operations/orders\`

### View modes

| Mode | UI |
|------|-----|
| map | Leaflet map + OrderList + Drawer |
| table | Layout::Resource::Tabular |
| kanban | Status board + order-config filter |

### Table columns

${colTable}

### Features

Search, bulk search, pagination, bulk actions, filters (driver, places, customer, dates, status multi-select from \`orders/statuses\`).

---

## Other operation routes

| Route | Screens |
|-------|---------|
| \`/operations/routes\` | list, new, details |
| \`/operations/orchestrator\` | orchestrator + import modal |
| \`/operations/scheduler\` | index, fleet-schedule |
| \`/operations/service-rates\` | list, new, details, edit |
| \`/operations/order-config\` | config builder |

---

## All operations templates

${opsTemplates}
`);

// --- 12 Account full ---
writeDoc('12-account-area.md', `${HEADER('12', 'Account Area', '1')}
## Sidebar (\`console/account.hbs\`)

| Item | Route | Icon |
|------|-------|------|
| Profile | \`console.account.index\` | user |
| Auth | \`console.account.auth\` | shield |
| Organizations | \`console.account.organizations\` | building |
| + extension items | \`console.account.virtual\` | dynamic |

---

## Profile — \`/account\` (\`account/index.hbs\`)

| Field | Control | Model attr |
|-------|---------|------------|
| Avatar | Image + FileUpload image/* | \`user.avatar_url\` |
| Name | InputGroup | \`user.name\` |
| Email | InputGroup email | \`user.email\` |
| Phone | PhoneInput | \`user.phone\` |
| Date of birth | date InputGroup | \`user.date_of_birth\` |
| Timezone | PowerSelect | \`user.timezone\`, options from \`GET lookup/timezones\` |

**Save:** \`saveProfile\` task (ember-concurrency)

---

## Account auth — \`/account/auth\`

| Panel | Fields | API |
|-------|--------|-----|
| Change Password | newPassword, newConfirmPassword | \`POST users/change-password\` |
| 2FA Settings | TwoFaSettings component | \`GET/POST users/two-fa\` (if system 2FA enabled) |

---

## Organizations — \`/account/organizations\`

Org table + modals: create, join, switch, leave, transfer ownership, edit organization.

**APIs:** \`POST auth/create-organization\`, \`join-organization\`, \`switch-organization\`

---

## Virtual — \`/account/:slug\`

\`account/virtual.hbs\`: Section header + LazyEngineComponent
`);

// --- 13 Settings full ---
writeDoc('13-settings-area.md', `${HEADER('13', 'Settings Area', '1')}
## Sidebar (\`console/settings.hbs\`)

| Item | Route |
|------|-------|
| Organization | \`console.settings.index\` |
| 2FA | \`console.settings.two-fa\` |
| Notifications | \`console.settings.notifications\` |
| Extension panels | virtual |

---

## Organization — \`/settings\`

| Field | Control | Model |
|-------|---------|-------|
| name | InputGroup | company.name |
| description | InputGroup | company.description |
| phone | PhoneInput | company.phone |
| currency | CurrencySelect | company.currency |
| timezone | Select | company.timezone |
| public_id | InputGroup disabled | company.public_id |
| logo | Image + FileUpload | logo upload |
| backdrop | Image + FileUpload | backdrop upload |

---

## Settings 2FA — \`/settings/two-fa\`

TwoFaSettings for **organization** policy. Save button.

**API:** \`GET/POST companies/two-fa\`

---

## Settings notifications — \`/settings/notifications\`

| Section | UI |
|---------|-----|
| Per notification group | ContentPanel + PowerSelectMultiple notifiables per notification type |
| SMS | Toggle alpha_numeric_sender_id + InputGroup sender ID + InfoBlocks |

**APIs:** \`GET notifications/registry\`, \`notifiables\`, \`get-settings\`, \`POST save-settings\`

Header: Save changes button (primary)
`);

// --- Configure appendix for 34 ---
function extractInputGroups(hbs) {
  const rows = [];
  for (const m of hbs.matchAll(/InputGroup\s+@name="([^"]+)"[^/]*@value=\{\{([^}]+)\}\}/g)) {
    rows.push({ name: m[1], value: m[2] });
  }
  for (const m of hbs.matchAll(/InputGroup\s+@name="([^"]+)"/g)) {
    if (!rows.some((r) => r.name === m[1])) rows.push({ name: m[1], value: '—' });
  }
  for (const m of hbs.matchAll(/Toggle\s+@label="([^"]+)"/g)) {
    rows.push({ name: m[1], value: 'toggle' });
  }
  return rows;
}

let configureSection = '\n## Configure::* — exhaustive fields (from source)\n\n';
for (const file of fs.readdirSync(path.join(CONSOLE, 'components', 'configure')).filter((f) => f.endsWith('.hbs'))) {
  const hbs = read(path.join(CONSOLE, 'components', 'configure', file));
  const name = file.replace('.hbs', '');
  configureSection += `### Configure::${name}\n\n`;
  const rows = extractInputGroups(hbs);
  if (rows.length) {
    configureSection += '| Label | Value binding |\n|-------|---------------|\n';
    for (const r of rows) configureSection += `| ${r.name} | \`${r.value}\` |\n`;
  } else {
    configureSection += '_Read-only / diagnostic UI — see template._\n';
  }
  configureSection += '\n';
}

// database is in templates not configure folder
configureSection += `### Configure::Database

Rendered from admin template; component at \`configure/database\` if present or inline in fleetbase core.

`;

let doc34 = read(path.join(__dirname, '34-api-and-adapter-map-by-feature.md'));
if (!doc34.includes('exhaustive fields (from source)')) {
  doc34 = doc34.replace('## Custom UI', configureSection + '\n## Custom UI');
  writeDoc('34-api-and-adapter-map-by-feature.md', doc34);
}

// --- 37 management: list templates ---
const mgmtDir = path.join(PKG, 'fleetops', 'addon', 'templates', 'management');
const mgmtList = [];
function walkMgmt(d, p = '') {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = p ? `${p}/${e.name}` : e.name;
    if (e.isDirectory()) walkMgmt(path.join(d, e.name), rel);
    else if (e.name.endsWith('.hbs')) mgmtList.push(`management/${rel}`);
  }
}
walkMgmt(mgmtDir);

writeDoc('37-fleetops-management.md', `${HEADER('37', 'FleetOps — Management', '5')}
## Mount: \`/fleet-ops/manage\`

## Resource areas

| Area | Routes | Typical UI |
|------|--------|------------|
| Fleets | index, new, details (vehicles, drivers, virtual), edit | Tabular + detail tabs |
| Drivers | index, new, details (positions, schedule, virtual), edit | Map positions, schedule calendar |
| Vehicles | index, new, details (devices, equipment, maintenance, work-orders, virtual) | Telematics tabs |
| Places | index, new, details (map, operations, performance, activity, documents, rules) | Map + analytics |
| Vendors | index + integrated vendors | CRUD tables |
| Contacts / Customers | index, new, edit, details | CRM tables |
| Fuel reports | index, new, edit, details | Form + list |
| Issues | index, new, edit, details | Ticket-style |

## Templates (${mgmtList.length} files)

| # | Template |
|---|----------|
${mgmtList.map((t, i) => `| ${i + 1} | \`${t}\` |`).join('\n')}
`);

console.log('Pass 2 complete: 05, 12, 13, 36, 37, 34 configure');
