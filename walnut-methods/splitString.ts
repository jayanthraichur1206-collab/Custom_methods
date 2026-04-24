import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Split String by Delimiter
 * description: Split ${inputString} by delimiter ${delimiter} at index ${index} and store in $[result]
 * actionType: custom_split_string
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function splitString(ctx: WalnutContext) {
  // ctx.args[0] = inputString value  (from ${inputString})
  // ctx.args[1] = delimiter value    (from ${delimiter})
  // ctx.args[2] = index value        (from ${index})
  // ctx.args[3] = "result"           (from $[result] — the variable name to store into)

  const inputString: string = ctx.args[0];
  const delimiter: string = ctx.args[1];
  const index: number = parseInt(ctx.args[2], 10);
  const outputVar: string = ctx.args[3];

  const parts = inputString.split(delimiter);

  if (isNaN(index)) {
    throw new Error(`Invalid index "${ctx.args[2]}" — must be a number.`);
  }

  if (index < 0 || index >= parts.length) {
    throw new Error(
      `Index ${index} is out of range — splitting "${inputString}" by "${delimiter}" yields ${parts.length} part(s) (indices 0–${parts.length - 1}).`
    );
  }

  const output = parts[index];
  ctx.log(`Split "${inputString}" by "${delimiter}" → parts: [${parts.join(', ')}]`);
  ctx.log(`Picked index ${index}: "${output}"`);

  ctx.setVariable(outputVar, output);
}
