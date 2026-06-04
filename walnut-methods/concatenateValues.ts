import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Concatenate Values
 * description: Concatenate ${value1} ${value2} ${value3} ${value4} ${value5} ${value6} ${value7} ${value8} ${value9} ${value10} and store in $[result]
 * actionType: custom_concatenate_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function concatenateValues(ctx: WalnutContext) {
  // ctx.args layout (all are positional from the description placeholders):
  //   args[0]  = value1   (from ${value1})
  //   args[1]  = value2   (from ${value2})
  //   ...
  //   args[9]  = value10  (from ${value10})
  //   args[10] = "result" (from $[result] — runtime variable name to store the concatenated string)
  //
  // HOW TO USE:
  //   - Each ${valueN} slot accepts a raw literal string OR a runtime/global/local variable name.
  //   - The method auto-detects: if getVariable(arg) returns a non-empty value, that stored value
  //     is used; otherwise the raw text of the arg itself is used.
  //   - Leave unused trailing slots blank (empty string) — they are automatically skipped.
  //   - The last argument MUST be $[result] — the runtime variable name where the concatenated
  //     string will be stored.
  //   - No separator is added between values; include any desired separator as one of the value slots.
  //
  // EXAMPLES:
  //   Concatenate "Hello" " " "World" → stores "Hello World"
  //   Concatenate $[firstName] " " $[lastName] → resolves both runtime vars, stores e.g. "John Doe"
  //   Concatenate $[baseUrl] "/api/v1/" $[endpoint] → stores e.g. "https://app.com/api/v1/users"

  // The last arg is always the output variable name (from $[result])
  const outputVarName: string = ctx.args[ctx.args.length - 1];

  if (!outputVarName || outputVarName.trim() === '') {
    throw new Error(
      'Output variable name is missing — the last placeholder must be $[result] ' +
      '(or any runtime variable name where the concatenated value will be stored).'
    );
  }

  // All args except the last are input values
  const inputArgs: string[] = ctx.args.slice(0, ctx.args.length - 1);

  if (inputArgs.length === 0) {
    throw new Error('No input values provided — add at least one ${value} placeholder before $[result].');
  }

  ctx.log(`Output variable : $[${outputVarName}]`);
  ctx.log(`Input slots     : ${inputArgs.length}`);

  const resolvedParts: string[] = [];

  for (let i = 0; i < inputArgs.length; i++) {
    const raw: string = inputArgs[i];

    // Skip completely empty/blank slots (unused placeholders left as empty string)
    if (raw === null || raw === undefined || raw === '') {
      ctx.log(`  [${i + 1}] (empty — skipped)`);
      continue;
    }

    // Auto-detect: try to resolve as a runtime / global / local variable first
    const fromVariable = ctx.getVariable(raw);

    let resolved: string;
    if (fromVariable !== null && fromVariable !== undefined && String(fromVariable).trim() !== '') {
      resolved = String(fromVariable);
      ctx.log(`  [${i + 1}] "${raw}" → resolved from variable = "${resolved}"`);
    } else {
      // Fall back to using the raw literal value (handles plain strings, numbers, separators, etc.)
      resolved = String(raw);
      ctx.log(`  [${i + 1}] "${raw}" → used as literal = "${resolved}"`);
    }

    resolvedParts.push(resolved);
  }

  if (resolvedParts.length === 0) {
    ctx.warn('All input slots were empty — storing an empty string in $[' + outputVarName + '].');
  }

  // Concatenate all resolved parts (no separator — include one as a value slot if needed)
  const concatenated: string = resolvedParts.join('');

  ctx.log(`Concatenated result : "${concatenated}"`);

  // Store the final value as a runtime variable
  ctx.setVariable(outputVarName, concatenated);

  ctx.log(`Stored concatenated value into runtime variable $[${outputVarName}].`);
}
