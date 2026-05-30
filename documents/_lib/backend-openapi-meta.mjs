/**
 * Normalized API metadata for future OpenAPI export (not emitted as OpenAPI yet).
 */

/**
 * @param {object} contract endpoint contract from contract-builder
 */
export function endpointToOpenApiPath(contract) {
  const pathKey = contract.path.replace(/\{(\w+)\}/g, '{$1}');
  const method = (contract.method || 'get').toLowerCase();

  const operation = {
    operationId: `${contract.pkgId}_${contract.action}_${method}`.replace(
      /[^a-zA-Z0-9_]/g,
      '_'
    ),
    summary: contract.title,
    tags: [contract.pkgId, contract.tier].filter(Boolean),
    security: inferSecurity(contract),
    parameters: [],
    requestBody: null,
    responses: {},
    'x-fleetbase': {
      handler: contract.handler,
      resourceClass: contract.response?.resourceClass,
      confidence: contract.confidence,
    },
  };

  if (contract.queryParams?.length) {
    operation.parameters = contract.queryParams.map((q) => ({
      name: q.name,
      in: 'query',
      schema: { type: 'string' },
      description: q.desc,
    }));
  }

  if (contract.request?.rules?.length) {
    operation.requestBody = {
      content: {
        'application/json': {
          schema: rulesToJsonSchema(contract.request.rules, contract.request.payloadKey),
          example: contract.sampleRequest,
        },
      },
    };
  }

  const successSchema = fieldsToJsonSchema(contract.response?.flatFields || []);
  operation.responses['200'] = {
    description: 'Success',
    content: {
      'application/json': {
        schema: contract.response?.paginated
          ? paginatedSchema(successSchema)
          : successSchema,
        example: contract.sampleResponse,
      },
    },
  };
  operation.responses['422'] = {
    description: 'Validation error',
    content: { 'application/json': { schema: { type: 'object' } } },
  };
  operation.responses['404'] = {
    description: 'Not found',
  };

  return { path: pathKey, method, operation };
}

function inferSecurity(contract) {
  const mw = contract.middleware || [];
  if (mw.some((m) => m.includes('protected') || m.includes('sanctum'))) {
    return [{ sessionAuth: [] }];
  }
  if (mw.some((m) => m.includes('fleetbase.api'))) {
    return [{ apiKeyBasic: [] }];
  }
  if (mw.some((m) => m.includes('registry'))) {
    return [{ registryAuth: [] }];
  }
  return [];
}

function rulesToJsonSchema(rules, rootKey) {
  const props = {};
  const required = [];
  for (const { field, rules: rs } of rules) {
    props[field] = { type: inferJsonType(rs) };
    if (String(rs).includes('required') && !String(rs).includes('nullable')) {
      required.push(field);
    }
  }
  const schema = { type: 'object', properties: props };
  if (required.length) schema.required = required;
  if (rootKey) return { type: 'object', properties: { [rootKey]: schema } };
  return schema;
}

function fieldsToJsonSchema(fields) {
  const props = {};
  for (const f of fields || []) {
    props[f.path || f.key] = {
      type: f.type === 'integer' ? 'integer' : f.type === 'boolean' ? 'boolean' : f.type === 'array' ? 'array' : 'string',
      nullable: f.nullable,
    };
  }
  return { type: 'object', properties: props };
}

function paginatedSchema(itemSchema) {
  return {
    type: 'object',
    properties: {
      data: { type: 'array', items: itemSchema },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
        },
      },
      links: { type: 'object' },
    },
  };
}

function inferJsonType(ruleStr) {
  const r = String(ruleStr).toLowerCase();
  if (r.includes('boolean')) return 'boolean';
  if (r.includes('integer') || r.includes('numeric')) return 'number';
  if (r.includes('array')) return 'array';
  if (r.includes('json')) return 'object';
  return 'string';
}

/**
 * @param {object[]} contracts
 */
export function buildOpenApiDocument(contracts) {
  const doc = {
    openapi: '3.1.0',
    info: {
      title: 'Fleetbase API (generated metadata)',
      version: '0.0.0-internal',
      description: 'Intermediate structure — not published as OpenAPI file yet.',
    },
    paths: {},
    components: {
      securitySchemes: {
        sessionAuth: { type: 'apiKey', in: 'cookie', name: 'fleetbase_session' },
        apiKeyBasic: { type: 'http', scheme: 'basic' },
        registryAuth: { type: 'apiKey', in: 'header', name: 'Authorization' },
      },
      schemas: {},
    },
    'x-endpoint-count': contracts.length,
    'x-generated': new Date().toISOString(),
  };

  for (const c of contracts) {
    const { path: pathKey, method, operation } = endpointToOpenApiPath(c);
    if (!doc.paths[pathKey]) doc.paths[pathKey] = {};
    doc.paths[pathKey][method] = operation;
    if (c.response?.resourceClass) {
      const schemaName = c.response.resourceClass.split('\\').pop();
      doc.components.schemas[schemaName] = fieldsToJsonSchema(
        c.response.flatFields
      );
    }
  }

  return doc;
}
