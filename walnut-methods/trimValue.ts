import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Trim Runtime Variable
 * description: Trim leading and trailing spaces from $[inputVar] and store in $[outputVar]
 * actionType: custom_trim_value
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function trimValue(ctx: WalnutContext) {
  // ctx.args[0] = "inputVar"  (from $[inputVar]  — runtime variable name to read)
  // ctx.args[1] = "outputVar" (from $[outputVar] — runtime variable name to store trimmed value)

  const inputVarName: string = ctx.args[0];
  const outputVarName: string = ctx.args[1];

  if (!inputVarName?.trim()) {
    throw new Error(
      'Input variable name is missing — the first placeholder must be a runtime variable $[varName] to trim.'
    );
  }

  if (!outputVarName?.trim()) {
    throw new Error(
      'Output variable name is missing — the second placeholder must be a runtime variable $[varName] where the trimmed value will be stored.'
    );
  }

  const rawValue = ctx.getVariable(inputVarName);

  if (rawValue == null) {
    throw new Error(
      `Runtime variable $[${inputVarName}] is not set. Make sure it is stored by a previous step.`
    );
  }

  const original = String(rawValue);
  const trimmed = original.trim();

  ctx.log(`Input variable  : $[${inputVarName}]`);
  ctx.log(`Original value  : "${original}"`);
  ctx.log(`Trimmed value   : "${trimmed}"`);
  ctx.log(`Output variable : $[${outputVarName}]`);

  ctx.setVariable(outputVarName, trimmed);
  ctx.log(`Stored trimmed result into runtime variable $[${outputVarName}].`);
}
