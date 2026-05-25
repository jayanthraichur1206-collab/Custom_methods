import type { WalnutContext } from './walnut';

/** @walnut_method
 * name: Enter Today's Date
 * description: Enter today's date into the focused date field
 * actionType: custom_enter_todays_date
 * context: web
 * needsLocator: true
 * category: Forms
 */
export async function enterTodaysDate(ctx: WalnutContext) {
  const now = new Date();
  const day = now.getDate(); // e.g. 25
  const year = now.getFullYear(); // e.g. 2026
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[now.getMonth()]; // e.g. "May"

  const formatted = `${day} ${month} ${year}`; // e.g. "25 May 2026"

  await ctx.fill(ctx.locator, formatted);
}
