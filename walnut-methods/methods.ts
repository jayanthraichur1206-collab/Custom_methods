import type { WalnutContext } from './walnut';

// =============================================================================
// GET DOM TEXT AND STORE
// =============================================================================

/** @walnut_method
 * name: Get DOM Text and Store
 * description: Get DOM text from element ${selector} and store in $[text]
 * actionType: custom_get_dom_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getDomTextAndStore(ctx: WalnutContext) {
  // ctx.args[0] = selector  (from ${selector} — CSS/XPath locator of the target element)
  // ctx.args[1] = "text"    (from $[text]     — runtime variable name to store the text)

  const selector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];
  const page = (ctx as any).page;

  if (!selector || selector.trim() === '') {
    throw new Error('No locator provided. Pass a valid CSS or XPath selector via ${selector}.');
  }

  ctx.log(`Locator received: "${selector}"`);

  try {
    await page.waitForSelector(selector, { state: 'attached', timeout: 30000 });
  } catch {
    throw new Error(`Element not found in DOM after 30s. Locator: "${selector}"`);
  }

  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 30000 });
  } catch {
    throw new Error(`Element found but not visible after 30s. Locator: "${selector}"`);
  }

  let text: string;
  try {
    const element = page.locator(selector).first();
    text = await element.innerText({ timeout: 10000 });
    text = text.trim();
  } catch {
    throw new Error(`Failed to retrieve DOM text from element. Locator: "${selector}"`);
  }

  if (text === '') {
    ctx.warn(`Element "${selector}" was found but its DOM text is empty.`);
  }

  ctx.log(`DOM text retrieved: "${text}"`);
  ctx.setVariable(outputVar, text);
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${text}"`);
}

// =============================================================================
// SPLIT BY DELIMITER
// =============================================================================

/** @walnut_method
 * name: Split Text and Store
 * description: Split $[input] by ${delimiter} at index ${index} and store in $[output]
 * actionType: custom_split_by_delimiter
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function splitByDelimiter(ctx: WalnutContext) {
  // ctx.args[0] = "input"   (from $[input]     — runtime variable name holding the value to split)
  // ctx.args[1] = delimiter (from ${delimiter} — character or substring to split by)
  // ctx.args[2] = index     (from ${index}     — zero-based position of the part to retrieve)
  // ctx.args[3] = "output"  (from $[output]    — runtime variable name to store the result)

  const inputVarName: string = ctx.args[0];
  const delimiter: string = ctx.args[1];
  const outputVarName: string = ctx.args[3];

  const rawValue: string = ctx.getVariable(inputVarName);
  if (rawValue === null || rawValue === undefined) {
    throw new Error(`Runtime variable $[${inputVarName}] is not set or has no value.`);
  }

  const input: string = String(rawValue);
  if (input.trim() === '') {
    ctx.warn(`Runtime variable $[${inputVarName}] is an empty string — result will also be empty.`);
  }

  if (!delimiter) {
    throw new Error('Delimiter is empty — provide a character or substring to split by.');
  }

  const index: number = parseInt(ctx.args[2], 10);
  if (isNaN(index)) {
    throw new Error(`Invalid index "${ctx.args[2]}" — must be a whole number (e.g. 0, 1, 2).`);
  }

  if (!outputVarName || outputVarName.trim() === '') {
    throw new Error('Output variable name is empty — provide a runtime variable name via $[output].');
  }

  const parts: string[] = input.split(delimiter);

  ctx.log(`Input     : "${input}"`);
  ctx.log(`Delimiter : "${delimiter}"`);
  ctx.log(`Parts     : [${parts.map(p => `"${p}"`).join(', ')}]`);
  ctx.log(`Index     : ${index}`);

  if (index < 0 || index >= parts.length) {
    throw new Error(
      `Index ${index} is out of range — split produced ${parts.length} part(s) ` +
      `(valid indices: 0–${parts.length - 1}).`
    );
  }

  const result: string = parts[index].trim();
  ctx.log(`Result    : "${result}"`);
  ctx.setVariable(outputVarName, result);
  ctx.log(`Stored "${result}" into runtime variable $[${outputVarName}].`);
}

// =============================================================================
// COMPARE VALUES
// =============================================================================

/** @walnut_method
 * name: Compare Values
 * description: Compare $[param1] ${operator} ${param2} ignoring ${ignore}
 * actionType: custom_compare_values
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function compareValues(ctx: WalnutContext) {
  // ctx.args[0] = "param1"  (from $[param1]   — runtime variable name; value read via getVariable)
  // ctx.args[1] = operator  (from ${operator} — comparison operator, e.g. "equals", "contains")
  // ctx.args[2] = param2    (from ${param2}   — local/test-data value to compare against)
  // ctx.args[3] = ignore    (from ${ignore}   — pipe-separated substrings to strip before comparing; leave blank to skip)

  const param1VarName: string = ctx.args[0];
  const operator: string = ctx.args[1]?.trim().toLowerCase();
  const param2Raw: string = String(ctx.args[2] ?? '');
  const ignoreRaw: string = String(ctx.args[3] ?? '').trim();

  const param1Raw = ctx.getVariable(param1VarName);
  if (param1Raw === null || param1Raw === undefined) {
    throw new Error(`Runtime variable $[${param1VarName}] is not set or has no value.`);
  }

  // Strip pipe-separated substrings from a value before comparison
  function stripIgnored(value: string): string {
    if (!ignoreRaw) return value;
    const tokens = ignoreRaw.split('|').map(t => t.trim()).filter(t => t !== '');
    let out = value;
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'gi'), '');
    }
    return out;
  }

  const param1: string = stripIgnored(String(param1Raw).trim()).trim().toLowerCase();
  const param2: string = stripIgnored(param2Raw.trim()).trim().toLowerCase();

  ctx.log(`param1 ($[${param1VarName}]) raw : "${String(param1Raw).trim()}"`);
  ctx.log(`param2 (local) raw           : "${param2Raw.trim()}"`);
  if (ignoreRaw) {
    ctx.log(`ignore                       : "${ignoreRaw}"`);
    ctx.log(`param1 after strip           : "${param1}"`);
    ctx.log(`param2 after strip           : "${param2}"`);
  }
  ctx.log(`operator                     : "${operator}"`);

  let outcome: boolean;
  let explanation: string;

  switch (operator) {
    case 'equals':
      outcome = param1 === param2;
      explanation = `Expected "${param1}" to equal "${param2}"`;
      break;
    case 'not_equals':
      outcome = param1 !== param2;
      explanation = `Expected "${param1}" to not equal "${param2}"`;
      break;
    case 'contains':
      outcome = param1.includes(param2);
      explanation = `Expected "${param1}" to contain "${param2}"`;
      break;
    case 'not_contains':
      outcome = !param1.includes(param2);
      explanation = `Expected "${param1}" to not contain "${param2}"`;
      break;
    case 'starts_with':
      outcome = param1.startsWith(param2);
      explanation = `Expected "${param1}" to start with "${param2}"`;
      break;
    case 'ends_with':
      outcome = param1.endsWith(param2);
      explanation = `Expected "${param1}" to end with "${param2}"`;
      break;
    default:
      throw new Error(
        `Unsupported operator "${operator}". ` +
        `Supported: equals, not_equals, contains, not_contains, starts_with, ends_with.`
      );
  }

  if (outcome) {
    ctx.log(`PASS: ${explanation} — assertion passed.`);
  } else {
    const failMessage = `FAIL: ${explanation} — assertion failed.`;
    ctx.warn(failMessage);
    throw new Error(failMessage);
  }
}

// =============================================================================
// ARITHMETIC OPERATION
// =============================================================================

/** @walnut_method
 * name: Arithmetic Operation
 * description: Perform ${operator} on ${operand1} and ${operand2} and store result in $[result]
 * actionType: custom_arithmetic_operation
 * context: shared
 * needsLocator: false
 * category: Data Processing
 */
export async function arithmeticOperation(ctx: WalnutContext) {
  // ctx.args[0] = operator   (from ${operator}  — arithmetic operator: +, -, *, /)
  // ctx.args[1] = operand1   (from ${operand1}  — first operand; auto-detects runtime variable or raw value)
  // ctx.args[2] = operand2   (from ${operand2}  — second operand; auto-detects runtime variable or raw value)
  // ctx.args[3] = "result"   (from $[result]    — runtime variable name to store the computed result)

  const operator: string = ctx.args[0]?.trim();
  const operand1Raw: string = ctx.args[1];
  const operand2Raw: string = ctx.args[2];
  const resultVarName: string = ctx.args[3];

  const supportedOperators = ['+', '-', '*', '/'];
  if (!operator || !supportedOperators.includes(operator)) {
    throw new Error(
      `Unsupported operator "${operator}". Supported operators: ${supportedOperators.join(', ')}.`
    );
  }

  if (!resultVarName || resultVarName.trim() === '') {
    throw new Error('Result variable name is empty — provide a runtime variable name via $[result].');
  }

  // Smart resolve: try runtime variable first, fall back to raw value
  function resolveValue(raw: string, argIndex: number): string {
    if (!raw || raw.trim() === '') {
      throw new Error(`operand${argIndex} (ctx.args[${argIndex}]) is empty or not provided.`);
    }
    const fromRuntime = ctx.getVariable(raw);
    if (fromRuntime !== null && fromRuntime !== undefined && String(fromRuntime).trim() !== '') {
      ctx.log(`operand${argIndex}: resolved from runtime variable $[${raw}] = "${fromRuntime}"`);
      return String(fromRuntime).trim();
    }
    ctx.log(`operand${argIndex}: using raw value "${raw}"`);
    return String(raw).trim();
  }

  const operand1Str: string = resolveValue(operand1Raw, 1);
  const operand2Str: string = resolveValue(operand2Raw, 2);

  const operand1: number = parseFloat(operand1Str.replace(/,/g, ''));
  const operand2: number = parseFloat(operand2Str.replace(/,/g, ''));

  if (isNaN(operand1)) {
    throw new Error(`operand1 "${operand1Str}" is not a valid number.`);
  }
  if (isNaN(operand2)) {
    throw new Error(`operand2 "${operand2Str}" is not a valid number.`);
  }

  ctx.log(`Operation  : ${operand1} ${operator} ${operand2}`);

  let result: number;

  switch (operator) {
    case '+':
      result = operand1 + operand2;
      break;
    case '-':
      result = operand1 - operand2;
      break;
    case '*':
      result = operand1 * operand2;
      break;
    case '/':
      if (operand2 === 0) {
        throw new Error('Division by zero is not allowed — operand2 resolved to 0.');
      }
      result = operand1 / operand2;
      break;
    default:
      throw new Error(`Unhandled operator "${operator}".`);
  }

  const resultValue: string = result.toFixed(2);
  ctx.log(`Result     : ${operand1} ${operator} ${operand2} = ${resultValue}`);
  ctx.setVariable(resultVarName, resultValue);
  ctx.log(`Stored "${resultValue}" into runtime variable $[${resultVarName}].`);
}
