/**
 * lib/responses.ts — Standard JSON response helpers.
 */

export const corsHeaders = (req: Request): Record<string, string> => ({
  "Access-Control-Allow-Origin": req.headers.get("origin") || "https://www.nev3s.com",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-turnstile-token",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin",
});

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(new Request("https://www.nev3s.com")), "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message, status }, status);
}
