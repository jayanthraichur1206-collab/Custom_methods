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
  // ctx.args[0] = selector string  (from ${selector} — must be provided in test data)
  // ctx.args[1] = "result"         (from $[result]   — runtime variable name)

  const selector: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  const page = (ctx as any).page;

  if (!selector || selector.trim() === '') {
    throw new Error('selector is empty — provide a valid CSS or XPath selector in test data.');
  }

  // Wait for the element to be visible in the DOM (timeout: 30s)
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 30000 });
  } catch {
    throw new Error(`Element not found or not visible within 30s: "${selector}"`);
  }

  // Read innerText directly from the DOM node
  let text: string;
  try {
    text = await page.locator(selector).first().innerText({ timeout: 10000 });
    text = text.trim();
  } catch {
    throw new Error(`Failed to retrieve text from element: "${selector}"`);
  }

  ctx.log(`Element   : "${selector}"`);
  ctx.log(`DOM text  : "${text}"`);

  // Store into runtime variable
  ctx.setVariable(outputVar, text);
}
