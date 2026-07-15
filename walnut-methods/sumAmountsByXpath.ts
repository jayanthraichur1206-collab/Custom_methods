import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Sum Amounts By XPath Across Pages
 * description: Sum all amounts matching ${xpath} across paginated pages using next button ${nextButtonXpath} and store total in $[totalAmount]
 * actionType: custom_sum_amounts_by_xpath
 * context: web
 * needsLocator: false
 * category: Data Processing
 */
export async function sumAmountsByXpath(ctx: WalnutContext) {
  // ctx.args[0] = xpath             (from ${xpath} — XPath of the amount cells, e.g. all values in a column)
  // ctx.args[1] = nextButtonXpath   (from ${nextButtonXpath} — XPath of the Next page '>' button)
  // ctx.args[2] = "totalAmount"     (from $[totalAmount] — runtime variable name to store the final sum)

  const xpath = ctx.args[0];
  const nextButtonXpath = ctx.args[1];
  const outputVar = ctx.args[2];

  if (!xpath?.trim()) {
    throw new Error('No amount XPath provided. Step description must include ${xpath}.');
  }
  if (!nextButtonXpath?.trim()) {
    throw new Error('No next button XPath provided. Step description must include ${nextButtonXpath}.');
  }
  if (!outputVar?.trim()) {
    throw new Error('No output variable provided. Step description must include $[variableName].');
  }

  const page = (ctx as any).page;
  if (!page) throw new Error('Web page not available for custom_sum_amounts_by_xpath');

  let total = 0;
  let pageNum = 1;

  while (true) {
    ctx.log(`[sumAmountsByXpath] Processing page ${pageNum}...`);

    // Read all matching amount elements on the current page
    // Playwright requires 'xpath=' prefix to treat the selector as XPath
    const xpathSelector = xpath.startsWith('xpath=') ? xpath : `xpath=${xpath}`;
    const amountLocator = page.locator(xpathSelector);
    const count = await amountLocator.count();
    ctx.log(`[sumAmountsByXpath] Found ${count} element(s) on page ${pageNum}`);

    for (let i = 0; i < count; i++) {
      const element = amountLocator.nth(i);
      let rawText = '';

      // Try innerText → textContent → inputValue
      try { rawText = (await element.innerText() ?? '').trim(); } catch { /* fallback */ }
      if (!rawText) {
        try { rawText = (await element.textContent() ?? '').trim(); } catch { /* fallback */ }
      }
      if (!rawText) {
        try { rawText = (await element.inputValue() ?? '').trim(); } catch { /* fallback */ }
      }

      // Parse amount:
      // - Strip common currency symbols ($, £, €, ₹, ¥)
      // - Strip whitespace
      // - Handle parentheses as negative (e.g. (500.00) → -500.00)
      // - Strip commas used as thousands separators (e.g. 7,141.111 → 7141.111)
      let cleanText = rawText
        .replace(/[$£€₹¥₩]/g, '')
        .replace(/\s/g, '')
        .trim();

      const isNegative = cleanText.startsWith('(') && cleanText.endsWith(')');
      if (isNegative) {
        cleanText = cleanText.slice(1, -1);
      }

      cleanText = cleanText.replace(/,/g, '');

      const parsed = parseFloat(cleanText);

      if (isNaN(parsed)) {
        ctx.warn(`[sumAmountsByXpath] Page ${pageNum} element [${i}] text "${rawText}" is not numeric — skipping.`);
        continue;
      }

      const value = isNegative ? -parsed : parsed;
      ctx.log(`[sumAmountsByXpath] Page ${pageNum} element [${i}]: "${rawText}" → ${value}`);
      total += value;
    }

    // Check if the Next button is disabled — if so, we are on the last page
    const nextBtnSelector = nextButtonXpath.startsWith('xpath=') ? nextButtonXpath : `xpath=${nextButtonXpath}`;
    const nextBtn = page.locator(nextBtnSelector);
    const nextExists = await nextBtn.count();

    if (nextExists === 0) {
      ctx.log(`[sumAmountsByXpath] Next button not found — stopping pagination.`);
      break;
    }

    // Check disabled via attribute or aria-disabled
    const isDisabledAttr = await nextBtn.getAttribute('disabled');
    const isAriaDisabled = await nextBtn.getAttribute('aria-disabled');
    const classAttr = (await nextBtn.getAttribute('class')) ?? '';
    const isDisabledClass = classAttr.split(' ').some((c: string) =>
      ['disabled', 'is-disabled', 'btn-disabled', 'pagination-disabled'].includes(c)
    );

    const isDisabled =
      isDisabledAttr !== null ||
      isAriaDisabled === 'true' ||
      isDisabledClass;

    if (isDisabled) {
      ctx.log(`[sumAmountsByXpath] Next button is disabled — last page reached. Stopping.`);
      break;
    }

    // Click Next and wait for the table to update
    ctx.log(`[sumAmountsByXpath] Clicking Next button to go to page ${pageNum + 1}...`);

    // Capture the text of the first amount cell before clicking, so we can
    // wait until it changes — confirming the table has loaded new data.
    // let firstCellTextBefore = '';
    // try {
    //   firstCellTextBefore = (await amountLocator.first().textContent() ?? '').trim();
    // } catch { /* ignore — fallback to timeout */ }

    // await nextBtn.click();

    // // Wait until the first cell text changes (table refreshed) or 5s timeout
    // try {
    //   await page.waitForFunction(
    //     ({ sel, prev }: { sel: string; prev: string }) => {
    //       const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement | null;
    //       return el ? (el.textContent ?? '').trim() !== prev : false;
    //     },
    //     { sel: xpath, prev: firstCellTextBefore },
    //     { timeout: 5000 }
    //   );
    // } catch {
    //   // If wait times out (e.g. last page, or same value), fall back to a short pause
    //   await page.waitForTimeout(500);
    // }

    await nextBtn.click();

// Wait until Angular updates the table
await page.waitForLoadState('networkidle').catch(() => {});

// Wait for the table to detach and re-render
await page.waitForTimeout(1000);

// Wait until at least one amount cell is visible
await page.locator(xpathSelector).first().waitFor({
  state: 'visible',
  timeout: 10000
});

    pageNum++;
  }

  // Round to 3 decimal places to avoid floating-point drift
  const rounded = Math.round(total * 1000) / 1000;

  ctx.log(`[sumAmountsByXpath] Grand total across ${pageNum} page(s) = ${rounded}`);
  ctx.setVariable(outputVar, String(rounded));
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${rounded}"`);
}
