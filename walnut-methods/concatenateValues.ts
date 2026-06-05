import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Concatenate Values
 * description: Concatenate ${values} and store in $[result]
 * actionType: custom_concatenate_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function concatenateValues(ctx: WalnutContext) {
  // ctx.args[0] = values   (from ${values} — comma-separated list of literals or variable names)
  // ctx.args[1] = "result" (from $[result] — runtime variable name to store the concatenated string)
  //
  // HOW TO USE:
  //   - Pass a comma-separated list of values in ${values}.
  //   - Each item can be a plain literal OR any runtime/global/local variable name.
  //   - The method auto-detects: if getVariable(item) returns a non-empty value, that stored value
  //     is used; otherwise the raw item text itself is used as a literal.
  //   - No separator is added between items — include one as an item if needed (e.g. " " or "-").
  //   - The concatenated result is stored silently into the runtime variable named in $[result].
  //
  // EXAMPLES:
  //   values = "Hello, ,World"           → result = "Hello World"
  //   values = "firstName, ,lastName"    → resolves both runtime vars → result = "John Doe"
  //   values = "baseUrl,/api/v1/,endpoint" → result = "https://app.com/api/v1/users"
  //   values = "Order-,orderId,-2026"    → result = "Order-9871-2026"

  const valuesRaw: string = ctx.args[0];
  const outputVarName: string = ctx.args[1];

  // --- Validate output variable name ---
  if (!outputVarName || outputVarName.trim() === '') {
    throw new Error(
      'Output variable name is missing — the second placeholder must be $[result] ' +
      '(or any runtime variable name where the concatenated value will be stored).'
    );
  }

  // --- Validate input ---
  if (!valuesRaw || valuesRaw.trim() === '') {
    throw new Error(
      'No values provided — pass a comma-separated list of literals or variable names via ${values}.'
    );
  }

  ctx.log(`Output variable : $[${outputVarName}]`);
  ctx.log(`Raw input       : "${valuesRaw}"`);

  // Split by comma — each token is either a literal or a variable name
  const tokens: string[] = valuesRaw.split(',');

  ctx.log(`Token count     : ${tokens.length}`);

  const resolvedParts: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token: string = tokens[i]; // preserve inner spaces (e.g. " " as separator)

    // Skip tokens that are completely empty (e.g. trailing comma)
    if (token === null || token === undefined) {
      ctx.log(`  [${i + 1}] (null — skipped)`);
      continue;
    }

    const trimmed = token.trim();

    // Auto-detect: try to resolve as a runtime / global / local variable first
    const fromVariable = ctx.getVariable(trimmed);

    let resolved: string;
    if (fromVariable !== null && fromVariable !== undefined && String(fromVariable).trim() !== '') {
      resolved = String(fromVariable);
      ctx.log(`  [${i + 1}] "${trimmed}" → resolved from variable = "${resolved}"`);
    } else {
      // Use the raw token (preserves spaces used as separators, e.g. token = " ")
      resolved = token;
      ctx.log(`  [${i + 1}] "${token}" → used as literal`);
    }

    resolvedParts.push(resolved);
  }

  if (resolvedParts.length === 0) {
    ctx.warn('All tokens were empty — storing an empty string in $[' + outputVarName + '].');
  }

  // Join without any extra separator — caller controls separators via token list
  const concatenated: string = resolvedParts.join('');

  ctx.log(`Concatenated result : "${concatenated}"`);

  // Store the final value as a runtime variable
  ctx.setVariable(outputVarName, concatenated);

  ctx.log(`Stored concatenated value into runtime variable $[${outputVarName}].`);
}
