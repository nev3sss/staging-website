/**
 * NEV3S Dealership API — Worker entry point.
 *
 * Route map:
 *   POST   /api/v1/dealer-applications       Create draft / submit
 *   GET    /api/v1/dealer-applications/me    Get own application
 *   POST   /api/v1/documents/presign         R2 presigned PUT URL
 *   GET    /api/v1/admin/applications        List all (admin)
 *   PATCH  /api/v1/admin/applications/:id    Approve/reject/request_changes (admin)
 *   POST   /api/v1/enquiries                 Buyer enquiry on a listing
 *
 * Scheduled (cron):
 *   Daily 06:00 UTC  — 48h first-listing nudge (Email 6)
 *   1st @ 07:00 UTC  — 30-day check-in (Email 8)
 */

import { handleDealerApplication, handleGetMyApplication } from "./routes/dealer-applications";
import { handleDocumentPresign } from "./routes/documents";
import { handleAdminList, handleAdminPatch } from "./routes/admin";
import { handleEnquiry } from "./routes/enquiries";
import { runDailyNudge, runMonthlyCheckin } from "./lib/cron";
import { jsonResponse, errorResponse } from "./lib/responses";
import { corsHeaders } from "./lib/cors";

export interface Env {
  /** D1 database — schema uses prefixes: organization_*, seller_*, listing_*, admin_*, public_* */
  DB: D1Database;

  /** R2 buckets */
  DEALER_DOCS: R2Bucket;       // private — trade licences, authorization docs
  LISTING_MEDIA: R2Bucket;     // public — listing photos

  /** KV namespaces */
  FEATURE_FLAGS: KVNamespace;  // runtime toggles
  CONFIG: KVNamespace;          // read-only runtime config

  /** Secrets — set via `wrangler secret put` */
  TURNSTILE_SECRET: string;
  EMAIL_API_KEY: string;
  RESEND_API_KEY: string;
  ADMIN_API_TOKEN: string;
  JWT_SECRET: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    try {
      // ── Public form submission ─────────────────────────────────────────
      if (url.pathname === "/api/v1/dealer-applications" && req.method === "POST") {
        return handleDealerApplication(req, env, ctx);
      }

      // ── Document upload (presign) ──────────────────────────────────────
      if (url.pathname === "/api/v1/documents/presign" && req.method === "POST") {
        return handleDocumentPresign(req, env);
      }

      // ── Admin ─────────────────────────────────────────────────────────
      if (url.pathname === "/api/v1/admin/applications" && req.method === "GET") {
        return handleAdminList(req, env);
      }

      const adminPatchMatch = url.pathname.match(/^\/api\/v1\/admin\/applications\/([a-zA-Z0-9-]+)$/);
      if (adminPatchMatch && req.method === "PATCH") {
        return handleAdminPatch(req, env, adminPatchMatch[1]);
      }

      // ── Enquiries (buyer) ─────────────────────────────────────────────
      if (url.pathname === "/api/v1/enquiries" && req.method === "POST") {
        return handleEnquiry(req, env, ctx);
      }

      // ── Health check ──────────────────────────────────────────────────
      if (url.pathname === "/api/v1/health") {
        return jsonResponse({ status: "ok", time: new Date().toISOString() });
      }

      return errorResponse("Not found", 404);
    } catch (err) {
      // Never crash the Worker on unexpected errors.
      console.error("Unhandled error:", err);
      return errorResponse("Internal server error", 500);
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === "0 6 * * *") {
      ctx.waitUntil(runDailyNudge(env));
    }
    if (event.cron === "0 7 1 * *") {
      ctx.waitUntil(runMonthlyCheckin(env));
    }
  },
};
