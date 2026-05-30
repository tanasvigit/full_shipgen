/**
 * Dead code & orphan detection via call graph + route registry.
 */

/**
 * @param {object} ctx
 */
export function buildDeadCodeAnalysis(ctx) {
  const { semantic, callGraph, pkgData, eventRuntime, jobData } = ctx;
  const referenced = new Set();

  for (const e of callGraph?.edges || []) {
    referenced.add(e.to);
    referenced.add(e.from);
  }

  for (const pkg of pkgData) {
    for (const route of pkg.parsedRoutes || []) {
      if (route.handlerString) referenced.add(route.handlerString);
    }
  }

  for (const f of eventRuntime?.flows || []) {
    referenced.add(f.event);
    for (const s of f.steps) referenced.add(s.listener);
  }

  const artifacts = [];

  for (const j of jobData?.jobs || []) {
    const name = j.shortName;
    const refs = [...referenced].filter((r) => r && r.includes(name));
    if (refs.length === 0) {
      artifacts.push({
        artifact: name,
        status: 'possibly orphan',
        lastReference: j.triggerSource,
        type: 'job',
      });
    }
  }

  for (const file of semantic?.files || []) {
    if (!file.relPath.includes('Listeners/')) continue;
    const cls = file.classes[0];
    if (!cls) continue;
    const short = cls.name;
    const refs = [...referenced].filter((r) => r && r.includes(short));
    if (refs.length <= 1) {
      artifacts.push({
        artifact: cls.fqcn,
        status: 'weakly referenced',
        lastReference: refs[0] || 'EventServiceProvider only',
        type: 'listener',
      });
    }
  }

  for (const pkg of pkgData) {
    for (const c of pkg.controllers || []) {
      const short = c.class || '';
      const inRoutes = (pkg.parsedRoutes || []).some((r) =>
        (r.handlerString || '').includes(short)
      );
      if (!inRoutes && short && !referenced.has(short)) {
        artifacts.push({
          artifact: short,
          status: 'no route match',
          lastReference: c.file || '—',
          type: 'controller',
        });
      }
    }
  }

  return {
    artifacts: artifacts.slice(0, 40),
    stats: {
      suspects: artifacts.length,
    },
  };
}
