/**
 * Routes: enquiries.ts
 * POST /api/v1/enquiries — buyer submits enquiry on a dealer listing.
 * Triggers Email 7 to the dealer.
 */
import { jsonResponse, errorResponse } from "../lib/responses";
import { generateId } from "../lib/ids";
import { verifyTurnstileToken } from "../lib/turnstile";
import { sendEmail } from "../lib/email";
import type { RouteContext } from "./types";

interface EnquiryBody {
  dealerOrgId?: string;
  listingId?: string;
  message?: string;
  buyerName?: string;
  buyerEmail?: string;
  turnstileToken?: string;
}

export async function handleEnquiry(
  body: EnquiryBody,
  ctx: RouteContext
): Promise<Response> {
  if (!body.dealerOrgId || !body.message) {
    return errorResponse("dealerOrgId and message required", 400, ctx.request);
  }

  if (!body.buyerEmail) {
    return errorResponse("buyerEmail required", 400, ctx.request);
  }

  // Verify Turnstile
  const remoteip = ctx.request.headers.get("cf-connecting-ip") || undefined;
  const turnstileValid = await verifyTurnstileToken(
    body.turnstileToken || null,
    remoteip,
    ctx.env.TURNSTILE_SECRET_KEY
  );

  if (!turnstileValid) {
    return errorResponse("Turnstile verification failed", 403, ctx.request);
  }

  const enquiryId = generateId("enq");

  try {
    await ctx.env.DB
      .prepare(
        `INSERT INTO enquiries (id, type, email, full_name, message, metadata, turnstile_token, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        enquiryId,
        "general",
        body.buyerEmail,
        body.buyerName || "Anonymous",
        body.message,
        JSON.stringify({ dealerOrgId: body.dealerOrgId, listingId: body.listingId }),
        body.turnstileToken || "",
        remoteip || ""
      )
      .run();

    // Notify the dealer (Email 7) — best-effort, does not block/fail the enquiry.
    // sendEmail never throws, so no .catch() needed.
    ctx.executionCtx.waitUntil(
      notifyDealerOfEnquiry(ctx, body)
    );

    return jsonResponse(
      { message: "Enquiry sent to dealer.", enquiryId },
      201,
      ctx.request
    );
  } catch (err) {
    console.error("Enquiry insert error:", err);
    return errorResponse("Failed to submit enquiry", 500, ctx.request);
  }
}

/**
 * Looks up the dealer's contact email from D1 (via dealer_applications, keyed
 * on the org's application id) and sends the Email 7 buyer-enquiry alert.
 * No-op if the dealer can't be resolved — a missing lookup should never
 * surface as an error to the buyer.
 */
async function notifyDealerOfEnquiry(ctx: RouteContext, body: EnquiryBody): Promise<void> {
  if (!body.dealerOrgId) return;

  const dealer = await ctx.env.DB
    .prepare("SELECT email, full_name FROM dealer_applications WHERE id = ?")
    .bind(body.dealerOrgId)
    .first<{ email: string; full_name: string }>();

  if (!dealer?.email) {
    console.warn(`[enquiries] no dealer email found for dealerOrgId=${body.dealerOrgId}`);
    return;
  }

  await sendEmail(ctx.env, {
    to: dealer.email,
    template: "email_7_enquiry",
    variables: {
      applicant_name: dealer.full_name,
      buyer_name: body.buyerName || "Anonymous",
      buyer_email: body.buyerEmail || "",
      message: body.message || "",
      listing_id: body.listingId || "",
    },
  });
}
