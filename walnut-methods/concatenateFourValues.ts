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
  // Agent passes ctx.args left-to-right from step_description placeholders:
  //   ${name}  → resolved test-data VALUE (e.g. "-", ".00", "CUSTOMER S ")
  //   $[name]  → runtime variable NAME only (e.g. "LC_Amuont_.00", "lc_amount_run")
  //
  // ctx.args[0..4] = up to 5 input parts
  // ctx.args[5]    = output variable name (from final $[...])
 
  const allArgs: string[] = ((ctx as any).args ?? []).map((a: unknown) => String(a ?? ''));
 
  if (allArgs.length < 2) {
    throw new Error(
      'concatenateFourValues needs at least 2 arguments — one or more values plus $[outputVar] in the step description.'
    );
  }
 
  const outputVarName = allArgs[allArgs.length - 1]!.trim();
 
  if (!outputVarName) {
    throw new Error(
      'Output variable name is missing — the last placeholder must be $[variable_name] where the concatenated value will be stored.'
    );
  }
 
  const valueArgs = allArgs.slice(0, -1);
 
  // "${valueN}" args are already resolved by the agent — use as literal if they contain spaces
  // (e.g. "CUSTOMER S "). "$[var]" args are names only — resolve via getVariable, including
  // names with dots (e.g. "LC_Amuont_.00").
  const resolve = (raw: string = ''): string => {
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    if (/\s/.test(trimmed)) return raw;
    // Only attempt variable lookup for valid identifier-like names (must start with a letter or _).
    // Literal values like ".00", "10,000", "-" must NOT be looked up as variables.
    if (!/^[a-zA-Z_]/.test(trimmed)) return raw;
    const fromVar = ctx.getVariable(trimmed);
    return fromVar != null && String(fromVar).trim() !== '' ? String(fromVar) : raw;
  };
 
  const values = valueArgs.map(resolve);
  const concatenated = values.join('');
 
  ctx.log(`Output variable     : $[${outputVarName}]`);
  values.forEach((v, i) => ctx.log(`value${i + 1} → resolved : "${v}"`));
  ctx.log(`Concatenated result : "${concatenated}"`);
 
  ctx.setVariable(outputVarName, concatenated);
  ctx.log(`Stored result into runtime variable $[${outputVarName}].`);
}