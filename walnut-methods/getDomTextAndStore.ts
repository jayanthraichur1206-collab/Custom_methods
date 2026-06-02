import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get DOM Text and Store
 * description: Get DOM text from element ${selector} and store in $[result]
 * actionType: custom_get_dom_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getDomTextAndStore(ctx: WalnutContext) {
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
}
