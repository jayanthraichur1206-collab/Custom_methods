import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Replace In String
 * description: In $[input] replace from index ${startIndex} to ${endIndex} with ${replacement} and store in $[output]
 * actionType: custom_replace_in_string
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function replaceInString(ctx: WalnutContext) {
  // ctx.args[0] = "input"       (from $[input]        — runtime variable name; value resolved via ctx.getVariable, falls back to raw string)
  // ctx.args[1] = startIndex    (from ${startIndex}   — zero-based start index, inclusive)
  // ctx.args[2] = endIndex      (from ${endIndex}     — zero-based end index, exclusive [start, end))
  // ctx.args[3] = replacement   (from ${replacement}  — string to insert; may be empty to delete the range)
  // ctx.args[4] = "output"      (from $[output]       — runtime variable name to store the result)

  const inputVarName: string = ctx.args[0];
  const startRaw: string     = String(ctx.args[1] ?? '');
  const endRaw: string       = String(ctx.args[2] ?? '');
  const replacement: string  = String(ctx.args[3] ?? '');
  const outputVarName: string = ctx.args[4];

  // --- Validate output variable name ---
  if (!outputVarName || String(outputVarName).trim() === '') {
    throw new Error('Output variable name is empty — provide a runtime variable name via $[output].');
  }

  // --- Smart resolve input: try runtime variable first, fall back to raw value ---
  let input: string;
  const fromRuntime = ctx.getVariable(inputVarName);
  if (fromRuntime !== null && fromRuntime !== undefined && String(fromRuntime).trim() !== '') {
    input = String(fromRuntime);
    ctx.log(`input: resolved from runtime variable $[${inputVarName}] = "${input}"`);
  } else {
    input = String(inputVarName ?? '');
    ctx.log(`input: using raw value "${input}"`);
  }

  // --- Parse and validate indices ---
  const startIndex = Number(startRaw);
  const endIndex   = Number(endRaw);

  if (startRaw === '' || isNaN(startIndex)) {
    throw new Error(`startIndex "${startRaw}" is not a valid number.`);
  }
  if (endRaw === '' || isNaN(endIndex)) {
    throw new Error(`endIndex "${endRaw}" is not a valid number.`);
  }
  if (!Number.isInteger(startIndex) || !Number.isInteger(endIndex)) {
    throw new Error(`startIndex and endIndex must be integers (got ${startIndex}, ${endIndex}).`);
  }
  if (startIndex < 0) {
    throw new Error(`startIndex must be >= 0 (got ${startIndex}).`);
  }
  if (endIndex < 0) {
    throw new Error(`endIndex must be >= 0 (got ${endIndex}).`);
  }
  if (startIndex >= endIndex) {
    throw new Error(`startIndex (${startIndex}) must be less than endIndex (${endIndex}).`);
  }
  if (startIndex > input.length) {
    throw new Error(`startIndex (${startIndex}) is beyond the string length (${input.length}).`);
  }
  if (endIndex > input.length) {
    throw new Error(`endIndex (${endIndex}) is beyond the string length (${input.length}).`);
  }

  ctx.log(`input      : "${input}" (length: ${input.length})`);
  ctx.log(`startIndex : ${startIndex}`);
  ctx.log(`endIndex   : ${endIndex} (exclusive)`);
  ctx.log(`replacement: "${replacement === '' ? '(empty — range will be deleted)' : replacement}"`);

  // --- Perform index-based replacement using slice [startIndex, endIndex) ---
  const result: string = input.slice(0, startIndex) + replacement + input.slice(endIndex);

  ctx.log(`removed    : "${input.slice(startIndex, endIndex)}"`);
  ctx.log(`result     : "${result}"`);

  // --- Store result into runtime variable ---
  ctx.setVariable(outputVarName, result);
  ctx.log(`Stored "${result}" into runtime variable $[${outputVarName}].`);
}
