import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Replace In String
 * description: In ${input} replace from index ${startIndex} to ${endIndex} with ${replacement} and store in $[output]
 * actionType: custom_replace_in_string
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function replaceInString(ctx: WalnutContext) {
  // ctx.args[0] = input       (from ${input}       — the string to process; auto-detects runtime variable or raw value)
  // ctx.args[1] = startIndex  (from ${startIndex}  — zero-based start index of the substring to replace, inclusive)
  // ctx.args[2] = endIndex    (from ${endIndex}    — zero-based end index of the substring to replace, exclusive)
  // ctx.args[3] = replacement (from ${replacement} — the string to insert; may be empty to delete the range)
  // ctx.args[4] = "output"    (from $[output]      — runtime variable name to store the result)

  const inputRaw: string = ctx.args[0];
  const startIndex: number = Number(ctx.args[1]);
  const endIndex: number = Number(ctx.args[2]);
  const replacement: string = String(ctx.args[3] ?? '');
  const outputVarName: string = ctx.args[4];

  // --- Validate output variable name ---
  if (!outputVarName || String(outputVarName).trim() === '') {
    throw new Error('Output variable name is empty — provide a runtime variable name via $[output].');
  }

  // --- Smart resolve input: try runtime variable first, fall back to raw value ---
  let input: string;
  const fromRuntime = ctx.getVariable(inputRaw);
  if (fromRuntime !== null && fromRuntime !== undefined && String(fromRuntime).trim() !== '') {
    input = String(fromRuntime);
    ctx.log(`input: resolved from runtime variable $[${inputRaw}] = "${input}"`);
  } else {
    input = String(inputRaw ?? '');
    ctx.log(`input: using raw value "${input}"`);
  }

  // --- Validate indices ---
  if (isNaN(startIndex) || !Number.isInteger(startIndex)) {
    throw new Error(`startIndex "${ctx.args[1]}" is not a valid integer.`);
  }
  if (isNaN(endIndex) || !Number.isInteger(endIndex)) {
    throw new Error(`endIndex "${ctx.args[2]}" is not a valid integer.`);
  }
  if (startIndex < 0) {
    throw new Error(`startIndex (${startIndex}) must be >= 0.`);
  }
  if (endIndex < startIndex) {
    throw new Error(`endIndex (${endIndex}) must be >= startIndex (${startIndex}).`);
  }
  if (startIndex > input.length) {
    throw new Error(`startIndex (${startIndex}) exceeds input length (${input.length}).`);
  }

  // Clamp endIndex to input length
  const clampedEnd = Math.min(endIndex, input.length);

  ctx.log(`input      : "${input}"`);
  ctx.log(`startIndex : ${startIndex}`);
  ctx.log(`endIndex   : ${clampedEnd} (requested: ${endIndex})`);
  ctx.log(`replacement: "${replacement === '' ? '(empty — range will be deleted)' : replacement}"`);

  // --- Perform index-based replacement using slice ---
  const result: string =
    input.slice(0, startIndex) + replacement + input.slice(clampedEnd);

  ctx.log(`result     : "${result}"`);

  // --- Store result into runtime variable ---
  ctx.setVariable(outputVarName, result);

  ctx.log(`Stored "${result}" into runtime variable $[${outputVarName}].`);
}
