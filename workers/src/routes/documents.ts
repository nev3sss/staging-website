/**
 * Routes: documents.ts
 * POST /api/v1/documents/presign — generate a 5-minute presigned PUT URL for R2 upload.
 * The actual file upload goes directly to R2 (not through the Worker),
 * which avoids passing binary payloads through the Worker (size + cost limits).
 */
import { Env } from "../index";
import { jsonResponse, errorResponse } from "../lib/responses";

export async function handleDocumentPresign(req: Request, env: Env): Promise<Response> {
  let body: { documentType?: string; filename?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (!body.filename || !body.contentType) {
    return errorResponse("filename and contentType required", 400);
  }

  const docType = body.documentType || "general";
  const objectKey = `docs/${docType}/${crypto.randomUUID()}/${body.filename}`;

  // Generate a 5-minute presigned PUT URL.
  const url = await env.DEALER_DOCS.createSignedUrl(
    objectKey,
    {
      method: "PUT",
      contentType: body.contentType,
      expiresInSeconds: 300, // 5 minutes
    }
  );

  return jsonResponse({ uploadUrl: url, objectKey, expiresIn: 300 });
}
