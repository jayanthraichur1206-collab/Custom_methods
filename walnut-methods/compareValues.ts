import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Compare Values
 * description: Compare $[param1] ${operator} ${param2} and store result in $[result]
 * actionType: custom_compare_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function compareValues(ctx: WalnutContext) {
  // ctx.args[0] = "param1"   (from $[param1]    — runtime variable name; value read via getVariable)
  // ctx.args[1] = operator   (from ${operator}  — comparison operator, e.g. "equals", "contains")
  // ctx.args[2] = param2     (from ${param2}    — local/test-data value to compare against)
  // ctx.args[3] = "result"   (from $[result]    — runtime variable name to store TRUE or FALSE)

  const param1VarName: string = ctx.args[0];
  const operator: string = ctx.args[1]?.trim().toLowerCase();
  const param2Raw: string = String(ctx.args[2] ?? '');
  const resultVarName: string = ctx.args[3];

  // --- Resolve param1 from runtime variable ---
  const param1Raw = ctx.getVariable(param1VarName);
  if (param1Raw === null || param1Raw === undefined) {
    throw new Error(`Runtime variable $[${param1VarName}] is not set or has no value.`);
  }

  // --- Normalize both values (trim + lowercase for case-insensitive comparison) ---
  const param1: string = String(param1Raw).trim().toLowerCase();
  const param2: string = param2Raw.trim().toLowerCase();

  ctx.log(`param1 ($[${param1VarName}]) : "${String(param1Raw).trim()}"`);
  ctx.log(`param2 (local)              : "${param2Raw.trim()}"`);
  ctx.log(`operator                    : "${operator}"`);

  // --- Validate result variable name ---
  if (!resultVarName || resultVarName.trim() === '') {
    throw new Error('Result variable name is empty — provide a runtime variable name via $[result].');
  }

  // --- Apply comparison ---
  let outcome: boolean;
  let explanation: string;

  switch (operator) {
    case 'equals':
      outcome = param1 === param2;
      explanation = `"${param1}" equals "${param2}"`;
      break;

    case 'not_equals':
      outcome = param1 !== param2;
      explanation = `"${param1}" not_equals "${param2}"`;
      break;

    case 'contains':
      outcome = param1.includes(param2);
      explanation = `"${param1}" contains "${param2}"`;
      break;

    case 'not_contains':
      outcome = !param1.includes(param2);
      explanation = `"${param1}" not_contains "${param2}"`;
      break;

    case 'starts_with':
      outcome = param1.startsWith(param2);
      explanation = `"${param1}" starts_with "${param2}"`;
      break;

    case 'ends_with':
      outcome = param1.endsWith(param2);
      explanation = `"${param1}" ends_with "${param2}"`;
      break;

    default:
      throw new Error(
        `Unsupported operator "${operator}". ` +
        `Supported: equals, not_equals, contains, not_contains, starts_with, ends_with.`
      );
  }

  const resultValue: string = outcome ? 'TRUE' : 'FALSE';

  ctx.log(`Evaluation  : ${explanation} → ${resultValue}`);

  // --- Store result into runtime variable ---
  ctx.setVariable(resultVarName, resultValue);

  ctx.log(`Stored "${resultValue}" into runtime variable $[${resultVarName}].`);
}
