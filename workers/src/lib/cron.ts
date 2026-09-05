/**
 * lib/cron.ts — Scheduled task handlers.
 * Cron triggers defined in wrangler.toml:
 *   "0 6 * * *"  → daily at 06:00 UTC  — 48h first-listing nudge (Email 6)
 *   "0 7 1 * *"  → 1st of month @ 07:00 UTC — 30-day check-in (Email 8)
 */
import { Env } from "../index";
import { sendEmail } from "./email";

export async function runDailyNudge(env: Env): Promise<void> {
  // Approved dealers with 0 listings, created 48h+ ago and not yet nudged.
  // (No dedicated "nudged" flag yet — this relies on the join against
  // listings being empty; re-running the cron on the same dealer before
  // they add a listing will re-send the nudge, which is an acceptable
  // trade-off until a `last_nudged_at` column is added.)
  const { results } = await env.DB.prepare(
    `SELECT da.id, da.email, da.full_name, da.business_name
     FROM dealer_applications da
     WHERE da.status = 'approved'
       AND datetime(da.updated_at) <= datetime('now', '-48 hours')
       AND NOT EXISTS (
         SELECT 1 FROM listings l WHERE l.seller_email = da.email
       )`
  ).all<{ id: string; email: string; full_name: string; business_name: string | null }>();

  for (const dealer of results) {
    // Best-effort: sendEmail never throws, so no .catch() needed.
    await sendEmail(env, {
      to: dealer.email,
      template: "email_6_nudge",
      variables: {
        applicant_name: dealer.full_name,
        business_name: dealer.business_name ?? "",
      },
    });
  }

  console.log(`[cron] Daily nudge — notified ${results.length} approved dealer(s) with 0 listings after 48h`);
}

export async function runMonthlyCheckin(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT id, email, full_name, business_name
     FROM dealer_applications
     WHERE status = 'approved'
       AND datetime(updated_at) <= datetime('now', '-30 days')`
  ).all<{ id: string; email: string; full_name: string; business_name: string | null }>();

  for (const dealer of results) {
    // Best-effort: sendEmail never throws, so no .catch() needed.
    await sendEmail(env, {
      to: dealer.email,
      template: "email_8_checkin",
      variables: {
        applicant_name: dealer.full_name,
        business_name: dealer.business_name ?? "",
      },
    });
  }

  console.log(`[cron] Monthly check-in — notified ${results.length} 30-day-active approved dealer(s)`);
}
