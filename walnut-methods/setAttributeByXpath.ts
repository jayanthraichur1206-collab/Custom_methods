import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Set Attribute by XPath
 * description: Set ${xpath} element ${attribute} attribute to ${value}
 * actionType: custom_set_attribute_by_xpath
 * context: web
 * needsLocator: false
 * category: Forms
 */
export async function setAttributeByXpath(ctx: WalnutContext) {
  // ctx.args[0]  = XPath expression  (from ${xpath})
  // ctx.args[1]  = attribute name    (from ${attribute})
  // ctx.args[2]  = value to set      (from ${value})

  const xpath: string     = ctx.args[0];
  const attribute: string = ctx.args[1];
  const value: string     = ctx.args[2];

  if (!xpath?.trim()) {
    throw new Error('No XPath provided. Step description must include ${xpath}.');
  }
  if (!attribute?.trim()) {
    throw new Error('No attribute name provided. Step description must include ${attribute}.');
  }
  if (value === undefined || value === null) {
    throw new Error('No value provided. Step description must include ${value}.');
  }

  ctx.log(`[setAttributeByXpath] xpath="${xpath}" attribute="${attribute}" value="${value}"`);

  const matched: boolean = await (ctx as any).evaluate(`
    (() => {
      const xpathExpr = ${JSON.stringify(xpath)};
      const attrName  = ${JSON.stringify(attribute)};
      const attrValue = ${JSON.stringify(value)};

      // Resolve the XPath to the first matching element in the regular DOM.
      const result = document.evaluate(
        xpathExpr,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );

      const el = result.singleNodeValue;
      if (!el) return false;

      // 1. Set via setAttribute (works for any standard HTML attribute).
      el.setAttribute(attrName, attrValue);

      // 2. Mirror as a DOM property so framework bindings (React/Angular/Vue)
      //    also receive the update (e.g. el.value, el.checked, el.disabled).
      try {
        const descriptor =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), attrName) ||
          Object.getOwnPropertyDescriptor(el, attrName);

        if (descriptor && descriptor.set) {
          descriptor.set.call(el, attrValue);
        } else {
          el[attrName] = attrValue;
        }
      } catch (_) {
        // property may be read-only; setAttribute already applied above
      }

      // 3. Dispatch events so reactive frameworks detect the change.
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    })()
  `);

  if (!matched) {
    throw new Error(
      `[setAttributeByXpath] No element found for xpath="${xpath}".`
    );
  }

  ctx.log(`[setAttributeByXpath] Successfully set "${attribute}"="${value}" on element at xpath="${xpath}"`);
}
