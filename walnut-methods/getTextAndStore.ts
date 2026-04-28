import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Text and Store
 * description: Get DOM text from element ${selector} and store in $[result]
 * actionType: custom_get_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getTextAndStore(ctx: WalnutContext) {
  // ctx.args[0] = selector  (from ${selector} — CSS/XPath of the target web element)
  // ctx.args[1] = "result"  (from $[result]  — runtime variable name to store the text)

  const selector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  // Use ctx.page to locate the element and read its DOM innerText
  const page = (ctx as any).page;
  const locator = page.locator(selector).first();

  // Wait for element to be present in the DOM before reading
  await locator.waitFor({ state: 'attached' });

  const text: string = (await locator.innerText()).trim();

  ctx.log(`Element: "${selector}"`);
  ctx.log(`DOM innerText captured: "${text}"`);

  // Store captured text into the runtime variable
  ctx.setVariable(outputVar, text);
}
