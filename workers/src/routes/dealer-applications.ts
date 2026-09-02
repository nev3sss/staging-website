/**
 * Routes: dealer-applications.ts
 * Handles POST /api/v1/dealer-applications and GET /api/v1/dealer-applications/me
 */
import { jsonResponse, errorResponse } from "../lib/responses";
import { Env } from "../index";
import { verifyTurnstileToken } from "../lib/turnstile";
import { generateId } from "../lib/ids";

export async function handleDealerApplication(
  req: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // ── Turnstile anti-bot check ─────────────────────────────────────────────
  const turnstileToken = req.headers.get("x-turnstile-token");
  const ip = req.headers.get("cf-connecting-ip") ?? undefined;

  const turnstileValid = await verifyTurnstileToken(
    turnstileToken,
    ip,
    env.TURNSTILE_SECRET
  );
  if (!turnstileValid) {
    return errorResponse("Security verification failed. Please refresh and try again.", 403);
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  // ── Validate ────────────────────────────────────────────────────────────
  const errors = validateApplication(body);
  if (errors.length > 0) {
    return jsonResponse({ errors }, 422);
  }

  const id = generateId("org");
  const now = new Date().toISOString();

  // ── Insert into D1 ─────────────────────────────────────────────────────
  try {
    await env.DB
      .prepare(
        `INSERT INTO organizations (
          id, status, legal_name, trade_license_no, trade_license_expiry,
          country, city, website, dealer_type, capabilities,
          source_channel, applied_via, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        "submitted",
        body.legalName as string,
        body.tradeLicenseNo as string,
        body.tradeLicenseExpiry as string,
        body.country as string,
        body.city as string,
        (body.website as string) ?? null,
        body.dealerType as string,
        JSON.stringify(body.capabilities ?? []),
        body.sourceChannel as string ?? "direct",
        "website-form",
        now,
        now
      )
      .run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return errorResponse("Failed to save application. Please try again.", 500);
  }

  // ── Trigger Email 1 (Application Received) ────────────────────────────
  ctx.waitUntil(
    sendEmail(env, "email_1_received", body.email as string, {
      applicant_name: body.contactName,
      org_name: body.legalName,
      application_id: id,
    })
  );

  return jsonResponse(
    {
      message: "Application submitted successfully.",
      applicationId: id,
    },
    201
  );
}

export async function handleGetMyApplication(
  req: Request,
  env: Env
): Promise<Response> {
  // Extract Bearer token from Authorization header (JWT in cookie or header).
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401);
  }
  // TODO: verify JWT, extract org_id, query D1 for this org.
  return errorResponse("Not implemented yet — Phase 2", 501);
}

// ── Validation helpers ──────────────────────────────────────────────────────

type ValidationErrors = Array<{ field: string; message: string }>;

function validateApplication(body: Record<string, unknown>): ValidationErrors {
  const errors: ValidationErrors = [];

  if (!body.contactName || String(body.contactName).trim().length < 2) {
    errors.push({ field: "contactName", message: "Contact name is required." });
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    errors.push({ field: "email", message: "A valid email address is required." });
  }
  if (!body.phone || String(body.phone).trim().length < 8) {
    errors.push({ field: "phone", message: "A valid phone number is required." });
  }
  if (!body.legalName || String(body.legalName).trim().length < 2) {
    errors.push({ field: "legalName", message: "Legal business name is required." });
  }
  if (!body.tradeLicenseNo || String(body.tradeLicenseNo).trim().length < 3) {
    errors.push({ field: "tradeLicenseNo", message: "Trade licence number is required." });
  }
  if (!body.tradeLicenseExpiry) {
    errors.push({ field: "tradeLicenseExpiry", message: "Trade licence expiry date is required." });
  } else if (new Date(String(body.tradeLicenseExpiry)) <= new Date()) {
    errors.push({ field: "tradeLicenseExpiry", message: "Trade licence must not be expired." });
  }
  if (!body.country) {
    errors.push({ field: "country", message: "Country is required." });
  }
  if (!body.city || String(body.city).trim().length < 2) {
    errors.push({ field: "city", message: "City is required." });
  }
  if (!body.dealerType) {
    errors.push({ field: "dealerType", message: "Dealer type is required." });
  }

  return errors;
}

// ── Email stub ─────────────────────────────────────────────────────────────

async function sendEmail(
  env: Env,
  template: string,
  to: string,
  vars: Record<string, string>
): Promise<void> {
  // Implemented in lib/email.ts. This stub prevents type errors until email is wired.
  void env;
  void template;
  void to;
  void vars;
}
