/**
 * lib/turnstile.ts — Server-side Turnstile verification.
 * Cloudflare Turnstile (non-interactive). Secret key verified against cf-connecting-ip.
 */

export async function verifyTurnstileToken(
  token: string | null,
  remoteip: string | undefined,
  secretKey: string
): Promise<boolean> {
  if (!token || token.length < 10) return false;

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteip) body.append("remoteip", remoteip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    return data.success === true;
  } catch {
    return false;
  }
}
