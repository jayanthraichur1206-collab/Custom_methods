import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Element Text
 * description: Get text from DOM element ${selector} and store in $[result]
 * actionType: custom_get_element_text
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getElementText(ctx: WalnutContext) {
  // ctx.args[0] = selector value  (from ${selector})
  // ctx.args[1] = "result"        (from $[result] — the variable name to store into)

  const selector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  await ctx.waitForVisible(selector);

  const text = await ctx.getText(selector);

  ctx.log(`Extracted text from "${selector}": "${text}"`);

  ctx.setVariable(outputVar, text);
}
