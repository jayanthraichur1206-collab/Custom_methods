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
  // ctx.args[0] = xpath       (from ${xpath}      — XPath expression targeting the element, e.g. //my-component[@id='x'])
  // ctx.args[1] = attribute   (from ${attribute} — attribute name to read, e.g. "data-status", "href", "value")
  // ctx.args[2] = "result"    (from $[result]    — runtime variable name to store the retrieved attribute value)

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

  // Run in the browser: recursively walk all shadow roots, evaluate the XPath to
  // find the target element, then read the specified attribute by name.
  const result: string = await (ctx as any).evaluate(`
    (() => {
      const xpathExpr   = ${JSON.stringify(xpath)};
      const attrName    = ${JSON.stringify(attribute)};

      // Recursively collect every shadow root reachable from the given root.
      function collectRoots(root) {
        const roots = [root];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.shadowRoot) {
            roots.push(...collectRoots(node.shadowRoot));
          }
        }
        return roots;
      }

      const searchRoots = collectRoots(document);

      for (const searchRoot of searchRoots) {
        try {
          const nodeResult = document.evaluate(
            xpathExpr,
            searchRoot,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          const node = nodeResult.singleNodeValue;
          if (node) {
            // Element node — read attribute by name
            if (node.nodeType === Node.ELEMENT_NODE) {
              const val = node.getAttribute(attrName);
              if (val !== null) return val;
            }
            // Attribute node selected directly (e.g. xpath ends with /@attr)
            if (node.nodeType === Node.ATTRIBUTE_NODE) {
              return node.nodeValue ?? '';
            }
          }
        } catch (_) {
          // This shadow root does not contain a matching node — continue searching
        }
      }

      // Nothing found in any shadow root
      return '';
    })()
  `);

  const resultStr = result === null || result === undefined ? '' : String(result).trim();

  if (!resultStr) {
    ctx.warn(`[getShadowDomAttributeByXpath] Attribute "${attribute}" not found on element matching xpath="${xpath}" across all shadow roots.`);
  } else {
    ctx.log(`[getShadowDomAttributeByXpath] Found value: "${resultStr}"`);
  }

  // ctx.setVariable(outputVar, resultStr);
  // ctx.log(`Stored into runtime variable $[${outputVar}]: "${resultStr}"`);
  ctx.log("===== Runtime Variable Debug =====");
ctx.log(`Variable Name : ${outputVar}`);
ctx.log(`Variable Value: "${resultStr}"`);

try {
    ctx.setVariable(outputVar, resultStr);
    ctx.log(`SUCCESS: Stored runtime variable $[${outputVar}] = "${resultStr}"`);
} catch (error: any) {
    // WalnutContext does not define `error()`; use log() instead
    ctx.log(`FAILED to store runtime variable: ${error?.message || error}`);
    throw error;
}
}
