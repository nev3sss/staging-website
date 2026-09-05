/**
 * Routes: dealer-applications.ts
 * Handles POST /api/v1/dealer-applications and GET /api/v1/dealer-applications/me
 */
import { jsonResponse, errorResponse } from "../lib/responses";
import { verifyTurnstileToken } from "../lib/turnstile";
import { generateId } from "../lib/ids";
import { sendEmail } from "../lib/email";
import type { RouteContext } from "./types";

interface ApplicationForm {
  contactName: string;
  email: string;
  phone: string;
  legalName: string;
  tradeLicenseNo: string;
  tradeLicenseExpiry: string;
  country: string;
  city: string;
  dealerType: string;
  website?: string;
  capabilities?: string[];
  sourceChannel?: string;
}

function validateApplication(body: ApplicationForm): { success: false; errors: string[] } | { success: true } {
  const errors: string[] = [];

  if (!body.contactName || String(body.contactName).trim().length < 2) {
    errors.push("Contact name is required.");
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push("A valid email address is required.");
  }
  if (!body.phone || String(body.phone).trim().length < 8) {
    errors.push("A valid phone number is required.");
  }
  if (!body.legalName || String(body.legalName).trim().length < 2) {
    errors.push("Legal business name is required.");
  }
  if (!body.tradeLicenseNo || String(body.tradeLicenseNo).trim().length < 3) {
    errors.push("Trade licence number is required.");
  }
  if (!body.tradeLicenseExpiry) {
    errors.push("Trade licence expiry date is required.");
  } else if (new Date(body.tradeLicenseExpiry) <= new Date()) {
    errors.push("Trade licence must not be expired.");
  }
  if (!body.country) {
    errors.push("Country is required.");
  }
  if (!body.city || String(body.city).trim().length < 2) {
    errors.push("City is required.");
  }
  if (!body.dealerType) {
    errors.push("Dealer type is required.");
  }

  return errors.length > 0 ? { success: false, errors } : { success: true };
}

export async function handleDealerApplication(
  body: ApplicationForm,
  ctx: RouteContext
): Promise<Response> {
  // ── Turnstile anti-bot check ─────────────────────────────────────────────
  const turnstileToken = ctx.request.headers.get("x-turnstile-token");
  const ip = ctx.request.headers.get("cf-connecting-ip") ?? undefined;

  const turnstileValid = await verifyTurnstileToken(
    turnstileToken,
    ip,
    ctx.env.TURNSTILE_SECRET_KEY
  );
  if (!turnstileValid) {
    return errorResponse("Security verification failed. Please refresh and try again.", 403, ctx.request);
  }

  // ── Validate ────────────────────────────────────────────────────────────
  const validation = validateApplication(body);
  if (!validation.success) {
    const fieldErrors = validation.errors.map((msg) => {
      const map: Record<string, string> = {
        "Contact name is required.": "contactName",
        "A valid email address is required.": "email",
        "A valid phone number is required.": "phone",
        "Legal business name is required.": "legalName",
        "Trade licence number is required.": "tradeLicenseNo",
        "Trade licence expiry date is required.": "tradeLicenseExpiry",
        "Licence expiry date must be in the future.": "tradeLicenseExpiry",
        "Country is required.": "country",
        "City is required.": "city",
        "Dealer type is required.": "dealerType",
      };
      return { field: map[msg] || "general", message: msg };
    });
    return jsonResponse({ errors: fieldErrors }, 422, ctx.request);
  }

  const id = generateId("org");
  const now = new Date().toISOString();

  // ── Insert into D1 ─────────────────────────────────────────────────────
  try {
    await ctx.env.DB
      .prepare(
        `INSERT INTO dealer_applications (
          id, email, full_name, business_name, phone,
          created_at, updated_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.email,
        body.contactName,
        body.legalName,
        body.phone,
        now,
        now,
        JSON.stringify({
          tradeLicenseNo: body.tradeLicenseNo,
          tradeLicenseExpiry: body.tradeLicenseExpiry,
          country: body.country,
          city: body.city,
          dealerType: body.dealerType,
          website: body.website || null,
          capabilities: body.capabilities || [],
          sourceChannel: body.sourceChannel || "direct",
        })
      )
      .run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return errorResponse("Failed to save application. Please try again.", 500, ctx.request);
  }

  // Fire-and-forget confirmation email (Email 1) — never block the response on this.
  // Best-effort: sendEmail never throws, so no .catch() needed here.
  ctx.executionCtx.waitUntil(
    sendEmail(ctx.env, {
      to: body.email,
      template: "email_1_received",
      variables: { applicant_name: body.contactName, business_name: body.legalName },
    })
  );

  return jsonResponse(
    {
      message: "Application submitted successfully.",
      applicationId: id,
    },
    201,
    ctx.request
  );
}

export async function handleGetMyApplication(
  req: Request,
  ctx: RouteContext
): Promise<Response> {
  // Extract Bearer token from Authorization header (JWT in cookie or header).
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, req);
  }
  // TODO: verify JWT, extract org_id, query D1 for this org.
  return errorResponse("Not implemented yet — Phase 2", 501, req);
}