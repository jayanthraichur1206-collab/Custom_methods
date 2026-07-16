import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Get Shadow DOM Attribute by XPath
 * description: Locate Shadow DOM element by ${xpath} and read ${attribute} attribute value and store in $[result]
 * actionType: custom_get_shadow_dom_attribute_by_xpath
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function getShadowDomAttributeByXpath(ctx: WalnutContext) {
  // ctx.args[0] = xpath       (from ${xpath}     — XPath expression, e.g. //input[@title="user name field"])
  // ctx.args[1] = attribute   (from ${attribute} — attribute name to read, e.g. "placeholder", "value", "href")
  // ctx.args[2] = "result"    (from $[result]    — runtime variable name to store the retrieved value)

  const xpath: string = ctx.args[0];
  const attribute: string = ctx.args[1];
  const outputVar: string = ctx.args[2];

  if (!xpath?.trim()) {
    throw new Error('No XPath provided. Step description must include ${xpath}.');
  }
  if (!attribute?.trim()) {
    throw new Error('No attribute name provided. Step description must include ${attribute}.');
  }
  if (!outputVar?.trim()) {
    throw new Error('No output variable. Step description must include $[variableName].');
  }

  ctx.log(`[getShadowDomAttributeByXpath] xpath="${xpath}" attribute="${attribute}" outputVar="${outputVar}"`);

  const result: string = await (ctx as any).evaluate(`
    (() => {
      const xpathExpr = ${JSON.stringify(xpath)};
      const attrName  = ${JSON.stringify(attribute)};

      // WHY self:: approach:
      // document.evaluate() cannot use a ShadowRoot as a context node — it is a
      // browser-level restriction; XPath simply cannot see into shadow DOM.
      // Solution: collect every element from every shadow root via querySelectorAll
      // (which DOES work inside shadow roots), then test each element individually
      // with "self::" XPath so we only evaluate against a real Element node.
      //
      // //input[@title="x"]  →  self::input[@title="x"]
      // .//input[@title="x"] →  self::input[@title="x"]
      const selfExpr = xpathExpr.replace(/^\\.?\\/\\//, 'self::');

      // Recursively collect every element from the document and all nested shadow roots.
      // querySelectorAll('*') works correctly within a shadow root.
      function collectAllElements(root) {
        const elements = [];
        try {
          const els = root.querySelectorAll('*');
          for (const el of els) {
            elements.push(el);
            if (el.shadowRoot) {
              elements.push(...collectAllElements(el.shadowRoot));
            }
          }
        } catch (_) {}
        return elements;
      }

      const allElements = collectAllElements(document);

      for (const el of allElements) {
        try {
          const testResult = document.evaluate(
            selfExpr,
            el,
            null,
            XPathResult.BOOLEAN_TYPE,
            null
          );
          if (testResult.booleanValue) {
            // const val = el.getAttribute(attrName);
            // if (val !== null && val !== undefined) return val;
            // Try HTML attribute first
let val = el.getAttribute(attrName);

if (val !== null && val !== undefined && val !== "") {
    return String(val);
}

// Fallback to DOM property
try {
    const propVal = el[attrName];

    if (propVal !== null && propVal !== undefined && propVal !== "") {
        return String(propVal);
    }
} catch (_) {}

// Nothing found
          }
        } catch (_) {
          // element did not match or XPath error — continue
        }
      }

      return '';
    })()
  `);

  const resultStr = result === null || result === undefined ? '' : String(result).trim();

  if (!resultStr) {
    ctx.warn(`[getShadowDomAttributeByXpath] Attribute "${attribute}" not found for xpath="${xpath}" across all shadow roots.`);
  } else {
    ctx.log(`[getShadowDomAttributeByXpath] Found: "${resultStr}"`);
  }

  ctx.setVariable(outputVar, resultStr);
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${resultStr}"`);
}
