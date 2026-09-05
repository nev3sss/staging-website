/**
 * routes/documents.ts — R2 document upload/download endpoints.
 * Requires JWT authentication.
 */

import { corsHeaders, jsonResponse, errorResponse } from "../lib/responses";
import type { RouteContext } from "./types";

// Minimal Env subset needed by this route — avoids circular import from ../index
interface Env {
  DEALER_DOCS: R2Bucket;
  TURNSTILE_SECRET_KEY: string;
}

interface DocumentUploadBody {
  filename: string;
  contentType: string;
  data: string; // base64 encoded
}

/**
 * POST /documents/upload
 * Upload a document to the private DEALER_DOCS R2 bucket.
 * Requires Bearer token.
 */
export async function handleDocumentUpload(
  body: DocumentUploadBody,
  ctx: RouteContext
): Promise<Response> {
  // TODO: Verify JWT token from Authorization header
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, ctx.request);
  }

  // TODO: Extract dealer_id from JWT payload
  const dealerId = "temp-dealer-id"; // Replace with actual JWT decode

  if (!body.filename || !body.contentType || !body.data) {
    return errorResponse("Missing filename, contentType, or data", 400, ctx.request);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  const estimatedSize = Math.ceil((body.data.length * 3) / 4);
  if (estimatedSize > maxSize) {
    return errorResponse("File too large. Maximum size is 10MB.", 413, ctx.request);
  }

  // Validate content type
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(body.contentType)) {
    return errorResponse("Invalid file type", 400, ctx.request);
  }

  try {
    const objectKey = `dealers/${dealerId}/${Date.now()}-${body.filename}`;
    const binaryData = Uint8Array.from(atob(body.data), (c) => c.charCodeAt(0));

    await ctx.env.DEALER_DOCS.put(objectKey, binaryData, {
      httpMetadata: { contentType: body.contentType },
      customMetadata: {
        dealerId,
        originalFilename: body.filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    return jsonResponse(
      { success: true, objectKey, message: "Document uploaded successfully" },
      201,
      ctx.request
    );
  } catch (err) {
    console.error("Document upload error:", err);
    return errorResponse("Failed to upload document", 500, ctx.request);
  }
}

/**
 * GET /documents/:key
 * Get a signed URL for a document.
 * Requires Bearer token and verifies ownership.
 */
export async function handleDocumentGet(key: string, ctx: RouteContext): Promise<Response> {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, ctx.request);
  }

  const dealerId = "temp-dealer-id"; // TODO: Extract from JWT

  // Security: Only allow access to documents belonging to this dealer
  if (!key.startsWith(`dealers/${dealerId}/`)) {
    return errorResponse("Forbidden", 403, ctx.request);
  }

  try {
    const object = await ctx.env.DEALER_DOCS.get(key);
    if (!object) {
      return errorResponse("Document not found", 404, ctx.request);
    }

    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(key.split("/").pop() || "document")}`,
        "Cache-Control": "private, max-age=0, no-store",
        ...corsHeaders(ctx.request),
      },
    });
  } catch (err) {
    console.error("Document get error:", err);
    return errorResponse("Failed to get document", 500, ctx.request);
  }
}

/**
 * DELETE /documents/:key
 * Delete a document.
 * Requires Bearer token and verifies ownership.
 */
export async function handleDocumentDelete(key: string, ctx: RouteContext): Promise<Response> {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, ctx.request);
  }

  const dealerId = "temp-dealer-id"; // TODO: Extract from JWT

  if (!key.startsWith(`dealers/${dealerId}/`)) {
    return errorResponse("Forbidden", 403, ctx.request);
  }

  try {
    await ctx.env.DEALER_DOCS.delete(key);
    return jsonResponse({ success: true, message: "Document deleted" }, 200, ctx.request);
  } catch (err) {
    console.error("Document delete error:", err);
    return errorResponse("Failed to delete document", 500, ctx.request);
  }
}

/**
 * POST /documents/presign
 * Returns a presigned PUT URL for direct browser uploads.
 * Legacy endpoint — kept for backward compat.
 */
export async function handleDocumentPresign(
  req: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      filename?: string;
      contentType?: string;
    };

    if (!body.filename || !body.contentType) {
      return new Response(
        JSON.stringify({ error: "Missing filename or contentType" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Presigned uploads are not enabled. Use the authenticated upload endpoint.",
      }),
      { status: 501, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Document presign error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create presigned URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
