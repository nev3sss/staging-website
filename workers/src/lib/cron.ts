/**
 * lib/cron.ts — Scheduled task handlers.
 * Cron triggers defined in wrangler.toml:
 *   "0 6 * * *"  → daily at 06:00 UTC  — 48h first-listing nudge (Email 6)
 *   "0 7 1 * *"  → 1st of month @ 07:00 UTC — 30-day check-in (Email 8)
 */
import { Env } from "../index";

export async function runDailyNudge(env: Env): Promise<void> {
  // 1. Query D1: approved dealers with 0 listings, created > 48h ago.
  // 2. For each: trigger Email 6 (First Listing Reminder).
  // Stub: log what would run.
  console.log("[cron] Daily nudge — querying approved dealers with 0 listings after 48h");
}

export async function runMonthlyCheckin(env: Env): Promise<void> {
  // 1. Query D1: all approved dealers active > 30 days.
  // 2. For each: trigger Email 8 (30-Day Check-In).
  console.log("[cron] Monthly check-in — querying 30-day-active approved dealers");
}
