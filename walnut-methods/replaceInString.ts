import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Replace In String
 * description: In ${input} replace ${search} with ${replace} and store in $[output]
 * actionType: custom_replace_in_string
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function replaceInString(ctx: WalnutContext) {
  // ctx.args[0] = input    (from ${input}   — the string to process; auto-detects runtime variable or raw value)
  // ctx.args[1] = search   (from ${search}  — the substring to find and replace/remove)
  // ctx.args[2] = replace  (from ${replace} — the value to replace with; leave blank to remove the search value)
  // ctx.args[3] = "output" (from $[output]  — runtime variable name to store the result)

  const inputRaw: string = ctx.args[0];
  const search: string = String(ctx.args[1] ?? '');
  const replace: string = String(ctx.args[2] ?? '');
  const outputVarName: string = ctx.args[3];

  // --- Validate search value ---
  if (!search || search.trim() === '') {
    throw new Error('Search value is empty — provide a substring to search for via ${search}.');
  }

  // --- Validate output variable name ---
  if (!outputVarName || outputVarName.trim() === '') {
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

  if (input.trim() === '') {
    ctx.warn('Input string is empty — result will also be empty.');
  }

  ctx.log(`search  : "${search}"`);
  ctx.log(`replace : "${replace === '' ? '(blank — will remove search value)' : replace}"`);

  // --- Escape special regex characters in the search string ---
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // --- Replace all occurrences of search with replace (or remove if replace is blank) ---
  const result: string = input.replace(new RegExp(escapedSearch, 'g'), replace);

  ctx.log(`input   : "${input}"`);
  ctx.log(`result  : "${result}"`);

  // --- Store result into runtime variable ---
  ctx.setVariable(outputVarName, result);

  ctx.log(`Stored "${result}" into runtime variable $[${outputVarName}].`);
}
