/**
 * NEV3S Dealership API — Worker entry point.
 *
 * Route map:
 *   POST   /api/v1/dealer-applications       Create draft / submit
 *   GET    /api/v1/dealer-applications/me    Get own application
 *   POST   /api/v1/documents/upload          Upload to DEALER_DOCS R2
 *   POST   /api/v1/documents/presign         R2 presigned PUT URL (legacy)
 *   GET    /api/v1/documents/:key            Get signed URL for document
 *   DELETE /api/v1/documents/:key            Delete document
 *   GET    /api/v1/admin/applications        List all (admin)
 *   PATCH  /api/v1/admin/applications/:id    Approve/reject (admin)
 *   GET    /api/v1/admin/analytics           Admin analytics (admin)
 *   POST   /api/v1/enquiries                 Buyer enquiry on a listing
 *
 * Scheduled (cron):
 *   Daily 06:00 UTC  — 48h first-listing nudge (Email 6)
 *   1st @ 07:00 UTC  — 30-day check-in (Email 8)
 */

import { handleDealerApplication, handleGetMyApplication } from "./routes/dealer-applications";
import { handleDocumentUpload, handleDocumentGet, handleDocumentDelete, handleDocumentPresign } from "./routes/documents";
import { handleListApplications, handleUpdateApplication, handleAnalytics } from "./routes/admin";
import { handleEnquiry } from "./routes/enquiries";
import { runDailyNudge, runMonthlyCheckin } from "./lib/cron";
import { jsonResponse, errorResponse, corsHeaders } from "./lib/responses";

// Aliases matching the interface shapes defined in each route file.
// Keeping them local avoids circular-import risk; update here if the route shapes change.
type ApplicationForm = {
  contactName: string; email: string; phone: string; legalName: string;
  tradeLicenseNo: string; tradeLicenseExpiry: string; country: string;
  city: string; dealerType: string; website?: string; capabilities?: string[];
  sourceChannel?: string; turnstileToken?: string;
};
type DocumentUploadBody = { filename: string; contentType: string; data: string };
type EnquiryBody = { dealerOrgId?: string; listingId?: string; message?: string;
  buyerName?: string; buyerEmail?: string; turnstileToken?: string };
type AdminUpdateBody = { status: "approved" | "rejected" | "reviewed"; notes?: string };

export interface Env {
  /** D1 database — schema uses prefixes: organization_*, seller_*, listing_*, admin_*, public_* */
  DB: D1Database;

  /** R2 buckets */
  DEALER_DOCS: R2Bucket;       // private — trade licences, authorization docs
  LISTING_MEDIA: R2Bucket;     // public — listing photos

  /** KV namespaces */
  FEATURE_FLAGS: KVNamespace;  // runtime toggles
  CONFIG: KVNamespace;          // read-only runtime config

  /** Secrets — set via `wrangler secret put`. Optional where a local-dev
   *  fallback exists (e.g. RESEND_API_KEY → console.log instead of send). */
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string | undefined;
  JWT_SECRET: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    // Construct shared route context
    const routeCtx = {
      request: req,
      env,
      params: {} as Record<string, string>,
      executionCtx: ctx,
    };

    try {
      // ── Public form submission ─────────────────────────────────────────
      if (url.pathname === "/api/v1/dealer-applications" && req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as unknown as ApplicationForm;
        return handleDealerApplication(body, routeCtx);
      }

      if (url.pathname === "/api/v1/dealer-applications/me" && req.method === "GET") {
        return handleGetMyApplication(req, routeCtx);
      }

      // ── Document routes ─────────────────────────────────────────────────
      if (url.pathname === "/api/v1/documents/upload" && req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as unknown as DocumentUploadBody;
        return handleDocumentUpload(body, routeCtx);
      }

      if (url.pathname === "/api/v1/documents/presign" && req.method === "POST") {
        return handleDocumentPresign(req, env);
      }

      if (url.pathname.startsWith("/api/v1/documents/") && (req.method === "GET" || req.method === "DELETE")) {
        // Object keys contain slashes (e.g. "dealers/<id>/<ts>-<filename>"), so
        // capture everything after the prefix rather than a single path segment.
        const encodedKey = url.pathname.slice("/api/v1/documents/".length);
        if (encodedKey) {
          const key = decodeURIComponent(encodedKey);
          if (req.method === "GET") return handleDocumentGet(key, routeCtx);
          if (req.method === "DELETE") return handleDocumentDelete(key, routeCtx);
        }
      }

      // ── Admin ─────────────────────────────────────────────────────────
      if (url.pathname === "/api/v1/admin/applications" && req.method === "GET") {
        return handleListApplications(url.searchParams, routeCtx);
      }

      const adminPatchMatch = url.pathname.match(/^\/api\/v1\/admin\/applications\/([a-zA-Z0-9-]+)$/);
      if (adminPatchMatch && req.method === "PATCH") {
        const body = (await req.json().catch(() => ({}))) as unknown as AdminUpdateBody;
        return handleUpdateApplication(adminPatchMatch[1], body, routeCtx);
      }

      if (url.pathname === "/api/v1/admin/analytics" && req.method === "GET") {
        return handleAnalytics(routeCtx);
      }

      // ── Enquiries (buyer) ─────────────────────────────────────────────
      if (url.pathname === "/api/v1/enquiries" && req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as unknown as EnquiryBody;
        return handleEnquiry(body, routeCtx);
      }

      // ── Health check ──────────────────────────────────────────────────
      if (url.pathname === "/api/v1/health") {
        return jsonResponse({ status: "ok", time: new Date().toISOString() }, 200, req);
      }

      return errorResponse("Not found", 404, req);
    } catch (err) {
      // Never crash the Worker on unexpected errors.
      console.error("Unhandled error:", err);
      return errorResponse("Internal server error", 500, req);
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
