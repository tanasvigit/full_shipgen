/**
 * Expands FormRequest validation: static rules, if-branches, Laravel rule-string conditionals.
 */

function sliceBalancedBrackets(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '[') depth++;
    if (str[i] === ']') depth--;
    if (depth === 0) return str.slice(openIdx + 1, i);
  }
  return '';
}

/** @param {string} rulesBody */
export function parseValidationRules(rulesBody) {
  const rules = [];
  if (!rulesBody) return rules;
  const seen = new Set();

  for (const line of rulesBody.split('\n')) {
    const trimmed = line.trim();
    let field = null;
    let after = '';

    const fieldMatch = trimmed.match(/^['"]([\w.]+)['"]\s*=>\s*/);
    if (fieldMatch) {
      field = fieldMatch[1];
      after = trimmed.slice(fieldMatch[0].length);
    } else {
      const assignMatch = trimmed.match(/^\$\w+\[['"]([\w.]+)['"]\]\s*=\s*/);
      if (!assignMatch) continue;
      field = assignMatch[1];
      after = trimmed.slice(assignMatch[0].length);
    }
    if (!field || seen.has(field)) continue;
    let ruleStr = '';

    if (after.startsWith('new ')) {
      const cls = after.match(/^new\s+([\w\\]+)/);
      ruleStr = cls ? `new ${cls[1]}` : after.replace(/,$/, '');
    } else if (after.startsWith("'") || after.startsWith('"')) {
      const sm = after.match(/^['"]([^'"]+)['"]/);
      ruleStr = sm ? sm[1] : after;
    } else if (after.startsWith('[')) {
      const inner = sliceBalancedBrackets(after, 0);
      if (inner.includes('new ')) {
        ruleStr = inner.replace(/\s+/g, ' ').trim();
      } else {
        ruleStr = inner
          .replace(/['"]/g, '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join('|');
      }
    }

    if (ruleStr) {
      seen.add(field);
      const conditionals = extractRuleStringConditionals(ruleStr);
      rules.push({ field, rules: ruleStr, conditionals });
    }
  }

  return rules.sort((a, b) => a.field.localeCompare(b.field));
}

/** Parse required_if, sometimes, etc. from pipe-separated rule string */
export function extractRuleStringConditionals(ruleStr) {
  const out = [];
  const r = ruleStr.toLowerCase();
  const patterns = [
    [/required_if:([^|]+)/, 'required_if'],
    [/required_unless:([^|]+)/, 'required_unless'],
    [/exclude_if:([^|]+)/, 'exclude_if'],
    [/exclude_unless:([^|]+)/, 'exclude_unless'],
    [/prohibited_if:([^|]+)/, 'prohibited_if'],
    [/prohibited_unless:([^|]+)/, 'prohibited_unless'],
    [/required_with:([^|]+)/, 'required_with'],
    [/required_without:([^|]+)/, 'required_without'],
    [/required_with_all:([^|]+)/, 'required_with_all'],
    [/required_without_all:([^|]+)/, 'required_without_all'],
    [/sometimes/, 'sometimes'],
    [/nullable/, 'nullable'],
  ];
  for (const [re, kind] of patterns) {
    const m = r.match(re);
    if (m) out.push({ kind, param: m[1]?.trim() || null });
  }
  if (/rule::requiredif/i.test(ruleStr)) {
    out.push({ kind: 'Rule::requiredIf', param: ruleStr });
  }
  if (/rule::when/i.test(ruleStr)) {
    out.push({ kind: 'Rule::when', param: ruleStr });
  }
  return out;
}

/**
 * Parse if/elseif blocks inside rules().
 * @param {string} rulesBody
 */
export function parseConditionalValidation(rulesBody) {
  const branches = [];
  if (!rulesBody) return branches;

  let searchFrom = 0;
  while (searchFrom < rulesBody.length) {
    const slice = rulesBody.slice(searchFrom);
    const ifMatch = slice.match(/\b(if|elseif)\s*\(/);
    if (!ifMatch || ifMatch.index === undefined) break;

    const condStart = searchFrom + ifMatch.index + ifMatch[0].length;
    let depth = 1;
    let i = condStart;
    while (i < rulesBody.length && depth > 0) {
      if (rulesBody[i] === '(') depth++;
      if (rulesBody[i] === ')') depth--;
      i++;
    }
    const condition = rulesBody.slice(condStart, i - 1).trim();
    let braceStart = i;
    while (braceStart < rulesBody.length && /\s/.test(rulesBody[braceStart])) {
      braceStart++;
    }
    if (rulesBody[braceStart] !== '{') {
      searchFrom = braceStart + 1;
      continue;
    }
    depth = 1;
    i = braceStart + 1;
    while (i < rulesBody.length && depth > 0) {
      if (rulesBody[i] === '{') depth++;
      if (rulesBody[i] === '}') depth--;
      i++;
    }
    const block = rulesBody.slice(braceStart + 1, i - 1);
    const rules = parseValidationRules(block);
    if (condition) {
      branches.push({ condition, rules, kind: ifMatch[1] });
    }
    searchFrom = i;
  }

  return branches;
}

/** Collapse static + branch rules into conditional rules table rows */
export function buildConditionalRulesTable(staticRules, branches) {
  const rows = [];

  for (const rule of staticRules || []) {
    for (const c of rule.conditionals || []) {
      rows.push([
        `${c.kind}${c.param ? `: ${c.param}` : ''}`,
        rule.field,
        rule.rules,
      ]);
    }
  }

  for (const branch of branches || []) {
    for (const rule of branch.rules) {
      rows.push([branch.condition, rule.field, rule.rules]);
    }
  }

  return rows;
}
