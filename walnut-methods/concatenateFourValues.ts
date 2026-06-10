import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Concatenate Five Values
 * description: Concatenate ${value1}, ${value2}, ${value3}, ${value4} and ${value5} and store in $[CUSTOMER S]
 * actionType: custom_concatenate_five_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function concatenateFourValues(ctx: WalnutContext) {
  // ctx.args[0] = value1       (from ${value1})
  // ctx.args[1] = value2       (from ${value2})
  // ctx.args[2] = value3       (from ${value3})
  // ctx.args[3] = value4       (from ${value4})
  // ctx.args[4] = value5       (from ${value5})
  // ctx.args[5] = "CUSTOMER S" (from $[CUSTOMER S] — runtime variable name to store the result)

  const value1: string = ctx.args[0] ?? '';
  const value2: string = ctx.args[1] ?? '';
  const value3: string = ctx.args[2] ?? '';
  const value4: string = ctx.args[3] ?? '';
  const value5: string = ctx.args[4] ?? '';
  const outputVarName: string = ctx.args[5];

  // --- Validate output variable name ---
  if (!outputVarName || outputVarName.trim() === '') {
    throw new Error(
      'Output variable name is missing — the sixth placeholder must be $[CUSTOMER S] ' +
      '(or any runtime variable name where the concatenated value will be stored).'
    );
  }

  ctx.log(`Output variable : $[${outputVarName}]`);
  ctx.log(`value1          : "${value1}"`);
  ctx.log(`value2          : "${value2}"`);
  ctx.log(`value3          : "${value3}"`);
  ctx.log(`value4          : "${value4}"`);
  ctx.log(`value5          : "${value5}"`);

  // Resolve each value — if a runtime variable exists with that name, use its stored value;
  // otherwise treat the raw text as a literal string.
  const resolve = (raw: string): string => {
    if (!raw || raw.trim() === '') return raw;
    const fromVar = ctx.getVariable(raw.trim());
    if (fromVar !== null && fromVar !== undefined && String(fromVar).trim() !== '') {
      return String(fromVar);
    }
    return raw;
  };

  const resolved1 = resolve(value1);
  const resolved2 = resolve(value2);
  const resolved3 = resolve(value3);
  const resolved4 = resolve(value4);
  const resolved5 = resolve(value5);

  ctx.log(`resolved value1 : "${resolved1}"`);
  ctx.log(`resolved value2 : "${resolved2}"`);
  ctx.log(`resolved value3 : "${resolved3}"`);
  ctx.log(`resolved value4 : "${resolved4}"`);
  ctx.log(`resolved value5 : "${resolved5}"`);

  const concatenated: string = resolved1 + resolved2 + resolved3 + resolved4 + resolved5;

  ctx.log(`Concatenated result : "${concatenated}"`);

  ctx.setVariable(outputVarName, concatenated);

  ctx.log(`Stored concatenated value into runtime variable $[${outputVarName}].`);
}
