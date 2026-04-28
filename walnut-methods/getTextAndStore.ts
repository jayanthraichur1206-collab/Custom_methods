import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Text and Store
 * description: Get DOM text from web element ${element} and store in $[result]
 * actionType: custom_get_text_and_store
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getTextAndStore(ctx: WalnutContext) {
  // ctx.args[0] = element   (from ${element} — CSS/XPath selector of the web element)
  // ctx.args[1] = "result"  (from $[result]  — runtime variable name to store the text)

  const element: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  // Wait for the element to be present in the DOM (works even if not visible)
  await (ctx as any).waitForAttached(element);

  // Locate the element and read its full innerText from the DOM
  const locator = (ctx as any).page.locator(element).first();
  const text: string = (await locator.innerText()).trim();

  ctx.log(`Web element: "${element}"`);
  ctx.log(`DOM innerText captured: "${text}"`);

  // Store captured text into the runtime variable
  ctx.setVariable(outputVar, text);
}
