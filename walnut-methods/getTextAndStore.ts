import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Text and Store
 * description: Get DOM text from element and store in $[result]
 * actionType: custom_get_text_and_store
 * context: web
 * needsLocator: true
 * category: Query
 */
export async function getTextAndStore(ctx: WalnutContext) {
  // The web element is passed as an object (locator) by the user — not a string parameter
  // ctx.args[0] = "result"  (from $[result] — runtime variable name to store the text)

  const outputVar: string = ctx.args[0];

  // ctx.locator holds the Playwright Locator object passed by the user as the element
  const elementLocator = (ctx as any).locator;

  // Wait for the element to be present in the DOM
  await elementLocator.waitFor({ state: 'attached' });

  // Read the full innerText from the DOM of the passed element object
  const text: string = (await elementLocator.innerText()).trim();

  ctx.log(`DOM innerText captured: "${text}"`);

  // Store captured text into the runtime variable
  ctx.setVariable(outputVar, text);
}
