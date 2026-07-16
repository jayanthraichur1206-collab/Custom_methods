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

  // Values are inlined via JSON.stringify — the browser receives plain ES5 JS, no TypeScript.
  //
  // WHY XPath fails on Shadow DOM:
  //   document.evaluate() cannot pierce shadow roots — browser restriction.
  //
  // APPROACH: Convert XPath to a CSS selector using plain string operations (no regex),
  // then use el.matches() which works perfectly on elements inside any shadow root.
  //
  // Example:  //input[@title="user name field"]
  //   step 1  strip leading // or .//  → input[@title="user name field"]
  //   step 2  extract tag              → "input"
  //   step 3  extract [@k="v"] pairs  → [title="user name field"]
  //   step 4  CSS selector             → input[title="user name field"]

  const result: unknown = await (ctx as any).evaluate(`
    (() => {
      var xpathExpr = ${JSON.stringify(xpath)};
      var attrName  = ${JSON.stringify(attribute)};

      // ── Step 1: strip leading // or .//  ────────────────────────────────────
      var expr = xpathExpr;
      if (expr.indexOf('.//') === 0) { expr = expr.slice(3); }
      else if (expr.indexOf('//') === 0) { expr = expr.slice(2); }

      // ── Step 2: extract tag name (everything before first '[') ───────────────
      var bracketPos = expr.indexOf('[');
      var tag = (bracketPos === -1) ? expr : expr.slice(0, bracketPos);
      var predicates = (bracketPos === -1) ? '' : expr.slice(bracketPos);

      // ── Step 3: parse [@key="value"] predicates with plain string split ───────
      // predicates looks like:  [@title="user name field"][@id="x"]
      var cssParts = '';
      var remaining = predicates;
      while (remaining.length > 0) {
        var open = remaining.indexOf('[@');
        if (open === -1) break;
        var close = remaining.indexOf(']', open);
        if (close === -1) break;
        var inner = remaining.slice(open + 2, close); // e.g.  title="user name field"
        var eqPos = inner.indexOf('=');
        if (eqPos !== -1) {
          var k = inner.slice(0, eqPos);
          var v = inner.slice(eqPos + 1);
          // strip surrounding quotes
          if ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
              (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")) {
            v = v.slice(1, v.length - 1);
          }
          cssParts += '[' + k + '="' + v + '"]';
        }
        remaining = remaining.slice(close + 1);
      }

      var cssSelector = (tag === '*' ? '' : tag) + cssParts;
      if (!cssSelector) cssSelector = '*';

      // ── Step 4: collect every element across all shadow roots ─────────────────
      // querySelectorAll('*') works correctly inside a shadow root;
      // document.createTreeWalker and XPath do NOT.
      function collectAll(root) {
        var list = [];
        try {
          var els = root.querySelectorAll('*');
          for (var i = 0; i < els.length; i++) {
            list.push(els[i]);
            if (els[i].shadowRoot) {
              var inner = collectAll(els[i].shadowRoot);
              for (var j = 0; j < inner.length; j++) list.push(inner[j]);
            }
          }
        } catch (e) {}
        return list;
      }

      var all = collectAll(document);

      // ── Step 5: find first matching element and return the attribute ──────────
      for (var k = 0; k < all.length; k++) {
        var el = all[k];
        try {
          if (el.matches(cssSelector) && el.hasAttribute(attrName)) {
            return el.getAttribute(attrName);
          }
        } catch (e) {}
      }

      return null;
    })()
  `);

  const value = (result === null || result === undefined) ? '' : String(result).trim();

  if (result === null || result === undefined) {
    ctx.warn(`[getShadowDomAttributeByXpath] No match for xpath="${xpath}" with attribute="${attribute}" across all shadow roots.`);
  } else {
    ctx.log(`[getShadowDomAttributeByXpath] Found: "${value}"`);
  }

  ctx.setVariable(outputVar, value);
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${value}"`);
}
