import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Text and Store
 * description: Get text from ${selector} and store in $[result]
 * actionType: custom_get_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getTextAndStore(ctx: WalnutContext) {
  // ctx.args[0] = selector value  (from ${selector} — CSS/XPath of the target element)
  // ctx.args[1] = "result"        (from $[result]   — runtime variable name to store the text)

  const selector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  await ctx.waitForVisible(selector);

  const text = await ctx.getText(selector);

  ctx.log(`Fetched text from "${selector}": "${text}"`);

  ctx.setVariable(outputVar, text);
}
