/**
 * scripts/dealers/config.js
 * Public (non-secret) runtime configuration for the dealer form.
 * Values here are safe to commit — they are not secrets.
 *
 * SETUP: Replace the placeholder values below with your actual Cloudflare
 * Turnstile site key and Worker API URL before deploying.
 *
 * The Turnstile secret key goes in `workers/.dev.vars` and is set via
 * `wrangler secret put TURNSTILE_SECRET` — never in this file.
 */
window.NEV3S_CONFIG = {
  /** Cloudflare Turnstile site key — get from Cloudflare dashboard → Turnstile */
  turnstileSiteKey: "1x0000000000000000000000000000000AA", // REPLACE with your real site key

  /** Cloudflare Worker API base URL — the Worker handles /api/v1/* routes */
  apiBase: "https://api.nev3s.com",                      // REPLACE with your custom domain or .workers.dev URL

  /** Application form endpoint */
  applicationEndpoint: "https://api.nev3s.com/api/v1/dealer-applications", // REPLACE

  /** Application review window (business days) */
  reviewWindowDays: 3,

  /** Marketplace launch date */
  launchDate: "2027-01-01",
};

/** Make config available to other scripts immediately on load */
window.addEventListener("DOMContentLoaded", function () {
  // Inject Turnstile sitekey into the widget
  var widget = document.querySelector(".cf-turnstile");
  if (widget) widget.dataset.sitekey = window.NEV3S_CONFIG.turnstileSiteKey;
});
