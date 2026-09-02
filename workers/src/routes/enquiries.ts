/**
 * Routes: enquiries.ts
 * POST /api/v1/enquiries — buyer submits enquiry on a dealer listing.
 * Triggers Email 7 to the dealer.
 */
import { Env } from "../index";
import { jsonResponse, errorResponse } from "../lib/responses";

export async function handleEnquiry(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await req.json().catch(() => ({})) as {
    dealerOrgId?: string; listingId?: string; message?: string; buyerName?: string; buyerEmail?: string;
  };

  if (!body.dealerOrgId || !body.message) {
    return errorResponse("dealerOrgId and message required", 400);
  }

  // Insert enquiry into D1 (enquiries table — defined in Phase 4 feature contract)
  // TODO: full D1 insert

  // Trigger Email 7 (Enquiry Alert) to dealer
  ctx.waitUntil(Promise.resolve()); // stub

  return jsonResponse({ message: "Enquiry sent to dealer.", enquiryId: crypto.randomUUID() }, 201);
}
