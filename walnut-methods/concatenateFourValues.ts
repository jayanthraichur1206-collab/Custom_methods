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
  // ctx.args[0..4] = value1..value5 (from ${valueN})
  // ctx.args[5]    = "CUSTOMER S"   (from $[CUSTOMER S] — runtime variable name to store the result)
 
  const outputVarName: string = ctx.args[5];
 
  if (!outputVarName?.trim()) {
    throw new Error(
      'Output variable name is missing — the sixth placeholder must be any runtime variable $[variable_name] where the concatenated value will be stored).'
    );
  }
 
  // Resolve a raw arg: try variable lookup unless the value is a plain literal
  // (numeric/decimal/comma-formatted), which avoids treating ".00" as a variable name.
  const isLiteral = (s: string): boolean =>
    s.trim().length > 0 && /^[0-9,.\-\s$%]*$/.test(s.trim());
 
  const resolve = (raw: string = ''): string => {
    if (!raw.trim()) return raw;
    if (isLiteral(raw)) return raw;
    const fromVar = ctx.getVariable(raw.trim());
    return fromVar != null && String(fromVar).trim() !== '' ? String(fromVar) : raw;
  };
 
  const values = ctx.args.slice(0, 5).map(resolve);
  const concatenated = values.join('');
 
  ctx.log(`Output variable     : $[${outputVarName}]`);
  values.forEach((v, i) => ctx.log(`value${i + 1} → resolved : "${v}"`));
  ctx.log(`Concatenated result : "${concatenated}"`);
 
  ctx.setVariable(outputVarName, concatenated);
  ctx.log(`Stored result into runtime variable $[${outputVarName}].`);
}