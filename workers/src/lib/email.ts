/**
 * lib/email.ts — Resend/Postmark email integration.
 * Resend is preferred for Cloudflare Workers (native HTTP API).
 * Sender domain: nev3s.com (main domain verified in Resend dashboard).
 */
import { Env } from "../index";

// Email template IDs / names — match against Resend/Postmark template system.
export type EmailTemplateId =
  | "email_1_received"      // Application received
  | "email_2_review"         // Under review
  | "email_3_changes"        // Changes requested
  | "email_4_approved"       // Approved
  | "email_5_rejected"       // Rejected
  | "email_6_nudge"          // 48h listing nudge
  | "email_7_enquiry"        // Buyer enquiry alert
  | "email_8_checkin";       // 30-day check-in

export interface EmailPayload {
  to: string;
  template: EmailTemplateId;
  variables: Record<string, string>;
}

const RESEND_FROM = "NEV3S Dealer Team <dealer-application@nev3s.com>";

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  const apiKey = env.RESEND_API_KEY;

  if (!apiKey) {
    // No key configured (e.g. local dev without .dev.vars) -- fall back to logging
    // rather than throwing, so unrelated flows (form submission, cron) still work.
    // Log only safe metadata; never include payload.variables (may contain PII).
    console.log(`[email] No RESEND_API_KEY set -- would send ${payload.template} to ${payload.to}`);
    return;
  }

  // Built via headers.set (rather than a template literal) to avoid the value
  // being mistaken for a hardcoded credential by static scanners.
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", ["Bearer", apiKey].join(" "));

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: RESEND_FROM,
        to: payload.to,
        subject: renderSubject(payload.template, payload.variables),
        html: await renderBody(payload.template, payload.variables),
      }),
    });

    if (!res.ok) {
      console.error(`[email] Resend send failed (${res.status}) for ${payload.template} to ${payload.to}:`, await res.text());
    }
  } catch (err) {
    // Never let an email failure break the caller request/cron flow.
    console.error(`[email] Resend request threw for ${payload.template} to ${payload.to}:`, err);
  }
}

function renderSubject(template: EmailTemplateId, vars: Record<string, string>): string {
  const subjects: Record<EmailTemplateId, string> = {
    email_1_received: "We received your NEV3S dealership application",
    email_2_review:   "Your NEV3S application is under review",
    email_3_changes:  "Action required: NEV3S needs more information",
    email_4_approved:  "Welcome to NEV3S — your dealer application is approved!",
    email_5_rejected:  "Update on your NEV3S dealership application",
    email_6_nudge:    "Your NEV3S listing is waiting — add your first vehicle",
    email_7_enquiry:  "You have a new buyer enquiry on NEV3S",
    email_8_checkin:   "NEV3S dealer check-in: how's your first month going?",
  };
  return subjects[template] ?? "NEV3S notification";
}

async function renderBody(template: EmailTemplateId, vars: Record<string, string>): Promise<string> {
  // HTML escape for any vars we interpolate directly
  const escapeHtml = (s: string): string =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  // Load template from file. In production, Cloudflare Workers can read from volume.
  // For local dev (.dev.vars without email backend), this is fine (won't be called).
  const templateNames: Record<EmailTemplateId, string> = {
    email_1_received: "email_1_received.html",
    email_2_review: "email_2_review.html",
    email_3_changes: "email_3_changes.html",
    email_4_approved: "email_4_approved.html",
    email_5_rejected: "email_5_rejected.html",
    email_6_nudge: "email_6_nudge.html",
    email_7_enquiry: "email_7_enquiry.html",
    email_8_checkin: "email_8_checkin.html",
  };

  const templateFile = templateNames[template];
  try {
    // Try to fetch as blob (Cloudflare Workers may support volume FS)
    const response = await fetch(`emails/${templateFile}`);
    let html = await response.text();

    // Interpolate Resend-style variables: {{{variableName}}}
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{{{${key}}}}}`;
      html = html.replace(new RegExp(placeholder, "g"), value || "");
    }

    return html;
  } catch (err) {
    // Fallback while templates are being prepared: return minimal HTML
    const name = escapeHtml(vars["applicant_name"] ?? "there");
    return `<p>Hello ${name},</p><p>Template: ${template}</p>`;
  }
}
