import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Replace Matching Substring
 * description: In ${input} replace ${substring} with ${replacement} and store in $[output]
 * actionType: custom_replace_matching_substring
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function replaceMatchingSubstring(ctx: WalnutContext) {
  // ctx.args[0] = input       (from ${input}       — the source string; auto-detects runtime variable or raw value)
  // ctx.args[1] = substring   (from ${substring}   — the literal substring to find and replace; 1+ characters)
  // ctx.args[2] = replacement (from ${replacement} — the string to substitute in; may be empty to delete the match)
  // ctx.args[3] = "output"    (from $[output]      — runtime variable name to store the result)

  const inputRaw: string = ctx.args[0];
  const substring: string = String(ctx.args[1] ?? '');
  const replacement: string = String(ctx.args[2] ?? '');
  const outputVarName: string = ctx.args[3];

  // --- Validate substring ---
  if (!substring || substring.length === 0) {
    throw new Error('substring must be 1 or more characters.');
  }

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

  ctx.log(`input      : "${input}"`);
  ctx.log(`substring  : "${substring}"`);
  ctx.log(`replacement: "${replacement === '' ? '(empty — match will be deleted)' : replacement}"`);

  // --- Count occurrences before replacement ---
  const escapedSubstring = substring.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchCount = (input.match(new RegExp(escapedSubstring, 'g')) || []).length;

  if (matchCount === 0) {
    ctx.warn(`substring "${substring}" was not found in the input — output is unchanged.`);
  } else {
    ctx.log(`found ${matchCount} occurrence(s) — replacing all.`);
  }

  // --- Perform substring replacement (replaces ALL occurrences) ---
  const result: string = input.split(substring).join(replacement);

  ctx.log(`result     : "${result}"`);

  // --- Store result into runtime variable ---
  ctx.setVariable(outputVarName, result);
  ctx.log(`Stored "${result}" into runtime variable $[${outputVarName}].`);
}
