/**
 * lib/email.ts — Resend/Postmark email integration.
 * Resend is preferred for Cloudflare Workers (native HTTP API).
 * Sender domain: mail.nev3s.com (SPF + DKIM + DMARC configured separately).
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

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  // TODO: wire to Resend API once email account is set up.
  // Example Resend call (uncomment when API key is available):
  //
  // const res = await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${env.RESEND_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     from: "NEV3S Dealer Team <dealer-notify@nev3s.com>",
  //     to: payload.to,
  //     subject: renderSubject(payload.template, payload.variables),
  //     html: renderBody(payload.template, payload.variables),
  //   }),
  // });
  // if (!res.ok) console.error("Email send failed:", await res.text());

  // Stub — replace with real Resend/Postmark integration.
  console.log(`[email] Would send ${payload.template} to ${payload.to}`, payload.variables);
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

function renderBody(template: EmailTemplateId, vars: Record<string, string>): string {
  // TODO: load HTML templates from /emails/*.html and interpolate vars.
  return `<p>Hello ${vars["applicant_name"] ?? "there"},</p><p>Template: ${template}</p>`;
}
