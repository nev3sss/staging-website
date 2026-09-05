/**
 * scripts/dealers/config.js
 * Public (non-secret) runtime configuration for the dealer form.
 * Values here are safe to commit — they are not secrets.
 *
 * SETUP: Replace the placeholder values below with your actual Cloudflare
 * Turnstile site key and Worker API URL before deploying.
 *
 * The Turnstile secret key goes in `workers/.dev.vars` and is set via
 * `wrangler secret put TURNSTILE_SECRET_KEY` — never in this file.
 */
window.NEV3S_CONFIG = {
  /** Cloudflare Turnstile site key — get from Cloudflare dashboard → Turnstile */
  turnstileSiteKey: "0x4AAAAAAEk4H-qpKNXpT5Q-",

  /** Cloudflare Worker API base URL — the Worker handles /api/v1/* routes */
  apiBase: "https://nev3s-dealership-api.nev3s-dev.workers.dev",

  /** Application form endpoint */
  applicationEndpoint: "https://nev3s-dealership-api.nev3s-dev.workers.dev/api/v1/dealer-applications",

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
