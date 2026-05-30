# Ember Admin Panel: Core vs Extension-Driven Pages

This document compares:

1. built-in core admin pages defined directly in the Ember router/templates
2. extension-driven admin pages injected dynamically at runtime

Sources used:

- `console/router.map.js`
- `console/app/templates/console/admin.hbs`
- `console/app/routes/console/admin/**`
- `console/app/templates/console/admin/**`
- admin screenshot provided by the user

## Short Answer

### Core pages

Core admin pages are:

- statically declared in `console/router.map.js`
- backed by concrete route/template files in `console/app/routes/console/admin/**` and `console/app/templates/console/admin/**`
- mostly rendered as direct sidebar items or fixed config routes

### Extension-driven pages

Extension-driven admin pages are:

- not directly declared in the main static router as named business routes
- injected into the sidebar through `menuService.adminMenuItems` and `menuService.adminMenuPanels`
- rendered through the dynamic route host `console.admin.virtual`

## Architectural Difference

## Core admin pages

Core admin pages follow this pattern:

1. route declared in `console/router.map.js`
2. route class exists in `console/app/routes/console/admin/...`
3. template exists in `console/app/templates/console/admin/...`
4. sidebar item is hardcoded in `console/app/templates/console/admin.hbs`

### Example

- `Overview`
- `Organizations`
- `Branding`
- `2FA Config`
- `Schedule Monitor`
- `Services`
- `Mail`
- `Filesystem`
- `Queue`
- `Socket`
- `Push Notifications`

## Extension-driven admin pages

Extension-driven admin pages follow this pattern:

1. not hardcoded as a normal sidebar item in `console/app/templates/console/admin.hbs`
2. appear through:
   - `this.menuService.adminMenuItems`
   - `this.menuService.adminMenuPanels`
3. clicking them transitions through:
   - `console.admin.virtual`
4. the route resolves:
   - `lookupMenuItem('console:admin', slug, view)`
5. the template renders:
   - `@model.component`
   - through `lazy-engine-component`

### Meaning

These pages are effectively runtime-registered admin screens.

## Core Admin Pages

## Built-in root sidebar items

These are hardcoded directly in `console/app/templates/console/admin.hbs`:

1. `Overview`
2. `Organizations`
3. `Branding`
4. `2FA Config`
5. `Schedule Monitor`

## Built-in fixed system config sidebar items

Also hardcoded in `console/app/templates/console/admin.hbs`:

1. `Services`
2. `Mail`
3. `Filesystem`
4. `Queue`
5. `Socket`
6. `Push Notifications`

## Built-in nested subpages

Still core, but not direct root sidebar entries:

1. `Organizations > Users`
2. `Schedule Monitor > Logs`

## Built-in non-sidebar routes

Defined in router/templates but not surfaced in the built-in sidebar:

1. `Database Configuration`
2. `Cache`

## Extension-Driven Admin Pages Seen In Your Screenshot

These were visible in the screenshot but are not part of the core hardcoded sidebar block.

## Fleet-Ops Config panel

Visible page:

1. `Navigator App`

## Extensions Registry panel

Visible pages:

1. `Registry Config`
2. `Awaiting Review`
3. `Pending Publish`

## Side-By-Side Comparison

| Aspect | Core Admin Pages | Extension-Driven Admin Pages |
|---|---|---|
| Defined in `router.map.js` | Yes | Not as dedicated static business routes |
| Hardcoded in `console/admin.hbs` | Yes | No |
| Rendered via `adminMenuItems` / `adminMenuPanels` | No | Yes |
| Uses `console.admin.virtual` | Only dynamic route itself exists, but core pages mostly do not use it | Yes |
| Backed by direct route/template file pair | Yes | Not necessarily, depends on registered component |
| Present in every install | Yes | No |
| Controlled by runtime module/extension registration | No | Yes |
| Good example | `Overview`, `Branding`, `Services` | `Navigator App`, `Registry Config` |

## Route Handling Difference

## Core route handling

Core routes resolve directly:

- `/admin` -> `console.admin.index`
- `/admin/branding` -> `console.admin.branding`
- `/admin/config/services` -> `console.admin.config.services`

These have explicit route/template ownership.

## Extension-driven route handling

Dynamic items route through:

- `/admin/:slug`

which maps to:

- `console.admin.virtual`

That route asks the menu service to resolve the item:

- `lookupMenuItem('console:admin', slug, view)`

The template then mounts the registered component dynamically.

## Counting Difference

## Core only

Concrete built-in admin pages:

- `15`

## Visible sidebar in your screenshot

Visible total entries:

- `15`

Breakdown:

- `11` built-in visible entries
- `4` extension-driven visible entries

## Important Practical Interpretation

If you are documenting the platform from the perspective of the source code only:

- the admin panel is primarily a built-in static route tree with a dynamic extension host

If you are documenting the platform from the perspective of the running installation shown in your screenshot:

- the admin panel is a hybrid of:
  - core pages
  - extension-provided pages

That is why the screenshot includes categories like:

- `Fleet-Ops Config`
- `Extensions Registry`

even though those names are not declared in the static core Ember router.

## Best Way To Think About It

### Core pages

These are the product's guaranteed built-in admin capabilities.

### Extension-driven pages

These are install/runtime capabilities layered onto the admin panel through the menu registry system.

They expand the admin panel without requiring changes to the static router/sidebar template.

