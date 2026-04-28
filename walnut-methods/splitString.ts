import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Split String by Delimiter
 * description: Split ${input} by delimiter ${delimiter} at index ${index} and store in $[result]
 * actionType: custom_split_string
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function splitString(ctx: WalnutContext) {
  // ctx.args[0] = input      (from ${input}     — the string to be split)
  // ctx.args[1] = delimiter  (from ${delimiter} — character or substring used to split)
  // ctx.args[2] = index      (from ${index}     — position of the split result to retrieve)
  // ctx.args[3] = "result"   (from $[result]    — runtime variable name to store the output)

  /**
   * Core reusable function that performs the split logic.
   * @param input     - The string to split
   * @param delimiter - The character or substring to split by
   * @param index     - The zero-based position of the part to retrieve
   * @returns The retrieved part as a string, or an empty string on edge cases
   */
  function splitAndRetrieve(
    input: string | null | undefined,
    delimiter: string,
    index: number
  ): string {
    // Handle null or undefined input gracefully
    if (input === null || input === undefined) {
      ctx.warn('Input string is null or undefined — returning empty string.');
      return '';
    }

    // Handle empty input string
    if (input.trim() === '') {
      ctx.warn('Input string is empty — returning empty string.');
      return '';
    }

    // Split the input using the given delimiter
    const parts: string[] = input.split(delimiter);

    ctx.log(`Input     : "${input}"`);
    ctx.log(`Delimiter : "${delimiter}"`);
    ctx.log(`Parts     : [${parts.map(p => `"${p}"`).join(', ')}]`);
    ctx.log(`Index     : ${index}`);

    // Handle out-of-range index gracefully
    if (index < 0 || index >= parts.length) {
      ctx.warn(
        `Index ${index} is out of range — split produced ${parts.length} part(s) ` +
        `(valid indices: 0–${parts.length - 1}). Returning empty string.`
      );
      return '';
    }

    // Retrieve and return the value at the specified index
    return parts[index].trim();
  }

  // --- Resolve args ---
  const input: string = ctx.args[0];
  const delimiter: string = ctx.args[1];
  const outputVar: string = ctx.args[3];

  // Validate index is a valid number
  const index: number = parseInt(ctx.args[2], 10);
  if (isNaN(index)) {
    throw new Error(
      `Invalid index "${ctx.args[2]}" — must be a whole number (e.g. 0, 1, 2).`
    );
  }

  // Execute the reusable split function
  const result: string = splitAndRetrieve(input, delimiter, index);

  ctx.log(`Result    : "${result}"`);

  // Store the result into the runtime variable
  ctx.setVariable(outputVar, result);
}
