/**
 * lib/responses.ts — Standard JSON response helpers.
 */

export const corsHeaders = (req: Request): Record<string, string> => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(req.headers.get("origin")),
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-turnstile-token",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
});

const ALLOWED_ORIGINS = new Set([
  "https://www.nev3s.com",
  "https://staging.nev3s.com",
  "http://localhost:4173",
  "http://localhost:8787",
]);

function getAllowedOrigin(origin: string | null): string {
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.nev3s.com";
}

/**
 * Wraps a Response with CORS headers.
 * Use this for existing Response objects or when you can't pass a Request.
 */
export function wrapWithCors(res: Response, origin?: string): Response {
  const newHeaders = new Headers(res.headers);
  newHeaders.set("Access-Control-Allow-Origin", getAllowedOrigin(origin ?? null));
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-turnstile-token");
  newHeaders.set("Access-Control-Allow-Credentials", "true");
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
  } else {
    // Fallback if no request is provided, using the default origin
    Object.assign(headers, corsHeaders(new Request("https://www.nev3s.com")));
  }

  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message: string, status = 500, req?: Request): Response {
  return jsonResponse({ error: message, status }, status, req);
}
