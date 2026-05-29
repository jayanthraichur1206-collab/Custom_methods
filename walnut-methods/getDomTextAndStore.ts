import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Execute JS Query and Store
 * description: Execute JavaScript query ${jsQuery} on the page and store result in $[result]
 * actionType: custom_execute_js_query
 * context: web
 * needsLocator: false
 * category: Query
 */
export async function executeJsQuery(ctx: WalnutContext) {
  // ctx.args[0] = jsQuery  (from ${jsQuery} — JavaScript expression to evaluate in the browser)
  // ctx.args[1] = "result" (from $[result]  — runtime variable name to store the return value)

  const jsQuery: string = ctx.args[0];
  const outputVar: string = ctx.args[1];

  if (!jsQuery || jsQuery.trim() === '') {
    throw new Error('No JavaScript query provided. Pass a valid JS expression via ${jsQuery}.');
  }

  ctx.log(`Executing JS query: ${jsQuery}`);

  let result: unknown;
  try {
    result = await (ctx as any).evaluate(jsQuery);
  } catch (err: any) {
    throw new Error(`JavaScript query failed. Query: "${jsQuery}". Error: ${err?.message ?? err}`);
  }

  const resultStr = result === null || result === undefined ? '' : String(result);
  ctx.log(`JS query result: "${resultStr}"`);

  ctx.setVariable(outputVar, resultStr);
  ctx.log(`Stored into runtime variable $[${outputVar}]: "${resultStr}"`);
}
