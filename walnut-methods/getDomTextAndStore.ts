import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get DOM Text and Store
<<<<<<< HEAD
 * description: Get DOM text from element ${selector} and store in $[text]
=======
 * description: Get DOM text from element ${selector} and store in $[result]
>>>>>>> 2e44326d607f8b33c4b8dab3a217fd9723830270
 * actionType: custom_get_dom_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getDomTextAndStore(ctx: WalnutContext) {
<<<<<<< HEAD
  // ctx.args[0] = selector  (from ${selector} — CSS selector or XPath expression, no prefix needed)
  // ctx.args[1] = "text"    (from $[text]     — runtime variable name to store the text)

  const rawSelector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];
  const page = (ctx as any).page;

  // --- Validate locator ---
  if (!rawSelector || rawSelector.trim() === '') {
    throw new Error('No locator provided. Pass a valid CSS selector or XPath expression via ${selector}.');
  }

  // --- Auto-detect XPath and normalise ---
  // XPath expressions start with '/' or '(' — prepend 'xpath=' if not already prefixed
  const isXPath = /^(\(?\/)/.test(rawSelector.trim());
  const selector = isXPath && !rawSelector.startsWith('xpath=')
    ? `xpath=${rawSelector}`
    : rawSelector;

  ctx.log(`Locator resolved: "${selector}"`);

  // --- Wait until element is located in the DOM ---
  try {
    await page.waitForSelector(selector, { state: 'attached', timeout: 30000 });
  } catch {
    throw new Error(`Element not found in DOM after 30s. Locator: "${selector}"`);
  }

  // --- Wait until element is visible ---
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 30000 });
  } catch {
    throw new Error(`Element found but not visible after 30s. Locator: "${selector}"`);
  }

  // --- Retrieve text from the DOM element ---
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

  // --- Store into runtime variable ---
  ctx.setVariable(outputVar, text);

  ctx.log(`Stored into runtime variable $[text]: "${text}"`);
=======
  // ctx.args[0] = selector  (from ${selector} — XPath or CSS selector string from test data)
  // ctx.args[1] = "result"  (from $[result]  — runtime variable name to store the text value)

  const selector = ctx.args[0];
  const outputVar = ctx.args[1];

  if (!selector?.trim()) {
    throw new Error('No selector provided. Step description must include ${selector}.');
  }
  if (!outputVar?.trim()) {
    throw new Error('No output variable. Step description must include $[variableName].');
  }

  const page = (ctx as any).page;
  if (!page) throw new Error('Web page not available for custom_get_dom_text_and_store');

  const locator = page.locator(selector);

  let text = '';
  try { text = (await locator.innerText() ?? '').trim(); } catch { /* fallback */ }
  if (!text) {
    try { text = (await locator.textContent() ?? '').trim(); } catch { /* fallback */ }
  }
  if (!text) {
    try { text = (await locator.inputValue() ?? '').trim(); } catch { /* fallback */ }
  }

  ctx.log(`[getDomTextAndStore] selector="${selector}" text="${text}"`);
  ctx.setVariable(outputVar, text);
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${text}"`);
>>>>>>> 2e44326d607f8b33c4b8dab3a217fd9723830270
}
