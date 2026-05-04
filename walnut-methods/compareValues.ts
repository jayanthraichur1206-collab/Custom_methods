import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Compare Values
 * description: Compare $[param1] ${operator} ${param2} ignoring ${ignore}
 * actionType: custom_compare_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function compareValues(ctx: WalnutContext) {
  // ctx.args[0] = "param1"  (from $[param1]   — runtime variable name; value read via getVariable)
  // ctx.args[1] = operator  (from ${operator} — comparison operator, e.g. "equals", "contains")
  // ctx.args[2] = param2    (from ${param2}   — local/test-data value to compare against)
  // ctx.args[3] = ignore    (from ${ignore}   — pipe-separated substrings to strip before comparing; leave blank to skip)

  const param1VarName: string = ctx.args[0];
  const operator: string = ctx.args[1]?.trim().toLowerCase();
  const param2VarName: string = String(ctx.args[2] ?? '');
  const ignoreRaw: string = String(ctx.args[3] ?? '').trim();

  // --- Resolve param1 from runtime variable ---
  const param1Raw = ctx.getVariable(param1VarName);
  if (param1Raw === null || param1Raw === undefined) {
    throw new Error(`Runtime variable $[${param1VarName}] is not set or has no value.`);
  }

  const param2Raw = ctx.getVariable(param2VarName);
  if (param2Raw === null || param2Raw === undefined) {
    throw new Error(`Runtime variable $[${param2VarName}] is not set or has no value.`);
  }

  // --- Strip ignored substrings from a value ---
  // Supports pipe-separated list of substrings to ignore (e.g. "$|USD| " or just "$")
  function stripIgnored(value: string): string {
    if (!ignoreRaw) return value;
    const tokens = ignoreRaw.split('|').map(t => t.trim()).filter(t => t !== '');
    let result = value;
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'gi'), '');
    }
    return result;
  }

  // --- Normalize: strip ignored substrings, trim, lowercase ---
  const param1: string = stripIgnored(String(param1Raw).trim()).trim().toLowerCase();
  const param2: string = stripIgnored(param2Raw.trim()).trim().toLowerCase();

  ctx.log(`param1 ($[${param1VarName}]) raw : "${String(param1Raw).trim()}"`);
  ctx.log(`param2 (local) raw           : "${param2Raw.trim()}"`);
  if (ignoreRaw) {
    ctx.log(`ignore                       : "${ignoreRaw}"`);
    ctx.log(`param1 after strip           : "${param1}"`);
    ctx.log(`param2 after strip           : "${param2}"`);
  }
  ctx.log(`operator                     : "${operator}"`);

  // --- Apply comparison ---
  let outcome: boolean;
  let explanation: string;

  switch (operator) {
    case 'equals':
      outcome = param1 === param2;
      explanation = `Expected "${param1}" to equal "${param2}"`;
      break;

    case 'not_equals':
      outcome = param1 !== param2;
      explanation = `Expected "${param1}" to not equal "${param2}"`;
      break;

    case 'contains':
      outcome = param1.includes(param2);
      explanation = `Expected "${param1}" to contain "${param2}"`;
      break;

    case 'not_contains':
      outcome = !param1.includes(param2);
      explanation = `Expected "${param1}" to not contain "${param2}"`;
      break;

    case 'starts_with':
      outcome = param1.startsWith(param2);
      explanation = `Expected "${param1}" to start with "${param2}"`;
      break;

    case 'ends_with':
      outcome = param1.endsWith(param2);
      explanation = `Expected "${param1}" to end with "${param2}"`;
      break;

    default:
      throw new Error(
        `Unsupported operator "${operator}". ` +
        `Supported: equals, not_equals, contains, not_contains, starts_with, ends_with.`
      );
  }

  // --- Pass or fail ---
  if (outcome) {
    ctx.log(`PASS: ${explanation} — assertion passed.`);
  } else {
    const failMessage = `FAIL: ${explanation} — assertion failed.`;
    ctx.warn(failMessage);
    throw new Error(failMessage);
  }
}
