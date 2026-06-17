import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Trim Value
 * description: Trim leading and trailing whitespace from $[runtimeParam] and store in $[trimmedValue]
 * actionType: custom_trim_value
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function trimValue(ctx: WalnutContext) {
  // ctx.args[0] = runtime variable name to read from (from $[runtimeParam])
  // ctx.args[1] = runtime variable name to store trimmed result (from $[trimmedValue])
  const inputVarName = (ctx.args[0] ?? '').trim();
  const outputVarName = (ctx.args[1] ?? '').trim();

  if (!inputVarName) {
    throw new Error('Input variable name is missing — the first placeholder must be $[runtimeParam].');
  }

  if (!outputVarName) {
    throw new Error('Output variable name is missing — the second placeholder must be $[trimmedValue].');
  }

  const raw = ctx.getVariable(inputVarName);

  if (raw == null) {
    throw new Error(`Runtime variable "$[${inputVarName}]" is not set or has no value.`);
  }

  const trimmed = String(raw).trim();

  ctx.log(`Input variable  : $[${inputVarName}]`);
  ctx.log(`Raw value       : "${raw}"`);
  ctx.log(`Trimmed value   : "${trimmed}"`);
  ctx.log(`Output variable : $[${outputVarName}]`);

  ctx.setVariable(outputVarName, trimmed);
  ctx.log(`Stored trimmed value into runtime variable $[${outputVarName}].`);
}
