import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Text and Store
 * description: Get text from element and store in $[result]
 * actionType: custom_get_text_and_store
 * context: web
 * needsLocator: true
 * category: Query
 */
export async function getTextAndStore(ctx: WalnutContext) {
  // ctx.args[0] = "result"  (from $[result] — runtime variable name to store the text)
  // The element is passed directly as the locator target by the user (needsLocator: true)

  const outputVar: string = ctx.args[0];

  // Use ctx.page (raw Playwright) to locate the element passed by the user and read its innerText
  const locator = (ctx as any).page.locator((ctx as any).locator).first();

  await locator.waitFor({ state: 'attached' });

  const text: string = (await locator.innerText()).trim();

  ctx.log(`Fetched DOM text: "${text}"`);

  ctx.setVariable(outputVar, text);
}
