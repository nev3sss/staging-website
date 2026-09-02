/**
 * Admin routes — list and approve/reject dealer applications.
 * Requires authenticated admin session (JWT in cookie/header, verified in middleware).
 */
import { Env } from "../index";
import { jsonResponse, errorResponse } from "../lib/responses";

export async function handleAdminList(req: Request, env: Env): Promise<Response> {
  // TODO: extract admin JWT from cookie/header and verify against ADMIN_API_TOKEN / JWT_SECRET.
  // Then query: SELECT id, status, legal_name, country, created_at FROM organization_* WHERE ...
  return jsonResponse({ applications: [], note: "Admin auth + query not implemented yet — Phase 2" });
}

export async function handleAdminPatch(
  req: Request,
  env: Env,
  id: string
): Promise<Response> {
  // TODO: verify admin auth, read body { status: "approved" | "rejected" | "request_changes", note? },
  // update D1 organization_*, insert into admin_audit_log, trigger Email 4/5.
  return jsonResponse({ id, updated: true, note: "Admin patch not fully implemented — Phase 2" });
}
