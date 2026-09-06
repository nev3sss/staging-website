/**
 * lib/responses.ts — Standard JSON response helpers.
 */

export const corsHeaders = (req: Request): Record<string, string> => {
  const origin = getAllowedOrigin(req.headers.get("origin"));
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-turnstile-token",
    "Vary": "Origin",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
};

const ALLOWED_ORIGINS = new Set([
  "https://www.nev3s.com",
  "https://staging.nev3s.com",
  "http://localhost:4173",
  "http://localhost:8787",
]);

/**
 * Returns the request origin if it appears in the allowlist, otherwise null.
 * Returning null causes the CORS header block to be omitted, which the browser
 * treats as "no permission" — preventing unlisted origins from being echoed
 * back. `wrapWithCors` provides an explicit fallback when no Request is known.
 */
function getAllowedOrigin(origin: string | null): string | null {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

/**
 * Wraps a Response with CORS headers.
 * Use this for existing Response objects or when you can't pass a Request.
 */
export function wrapWithCors(res: Response, origin?: string): Response {
  const newHeaders = new Headers(res.headers);
  const allowed = getAllowedOrigin(origin ?? null);
  if (allowed) {
    newHeaders.set("Access-Control-Allow-Origin", allowed);
    newHeaders.set("Access-Control-Allow-Credentials", "true");
  }
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-turnstile-token");
  newHeaders.set("Vary", "Origin");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (req) {
    Object.assign(headers, corsHeaders(req));
  }
  // When no request is provided, emit no CORS headers at all. The browser will
  // refuse to expose the response to any caller. Server-to-server callers
  // don't need CORS headers.

  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message: string, status = 500, req?: Request): Response {
  return jsonResponse({ error: message, status }, status, req);
}
