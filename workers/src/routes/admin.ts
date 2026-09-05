/**
 * routes/admin.ts — Admin-only endpoints.
 * Requires Bearer token with admin role.
 */

import { jsonResponse, errorResponse } from "../lib/responses";
import type { RouteContext } from "./types";

/**
 * Middleware: Verify admin access from JWT.
 * Returns early with 401/403 if not authorized.
 */
export async function requireAdmin(req: Request, ctx: RouteContext): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, req);
  }

  // TODO: Decode JWT and check for admin role
  // const payload = await verifyToken(authHeader.slice(7), ctx.env.JWT_SECRET);
  // if (payload.role !== "admin") {
  //   return errorResponse("Forbidden", 403, req);
  // }

  return null; // Authorized
}

/**
 * GET /admin/applications
 * List all dealer applications (paginated).
 * Admin only.
 */
export async function handleListApplications(
  searchParams: URLSearchParams,
  ctx: RouteContext
): Promise<Response> {
  const authError = await requireAdmin(ctx.request, ctx);
  if (authError) return authError;

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const status = searchParams.get("status") || undefined;
  const offset = (page - 1) * limit;

  try {
    let query = "SELECT * FROM dealer_applications";
    const bindings: unknown[] = [];

    if (status) {
      query += " WHERE status = ?";
      bindings.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    bindings.push(limit, offset);

    const result = await ctx.env.DB
      .prepare(query)
      .bind(...bindings)
      .all();

    return jsonResponse({
      data: result.results,
      pagination: { page, limit, offset },
    }, 200, ctx.request);
  } catch (err) {
    console.error("List applications error:", err);
    return errorResponse("Failed to fetch applications", 500, ctx.request);
  }
}

/**
 * PATCH /admin/applications/:id
 * Update application status (approve/reject).
 * Admin only.
 */
export async function handleUpdateApplication(
  id: string,
  body: { status: "approved" | "rejected" | "reviewed"; notes?: string },
  ctx: RouteContext
): Promise<Response> {
  const authError = await requireAdmin(ctx.request, ctx);
  if (authError) return authError;

  const validStatuses = ["approved", "rejected", "reviewed"];
  if (!validStatuses.includes(body.status)) {
    return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400, ctx.request);
  }

  try {
    const result = await ctx.env.DB
      .prepare(
        "UPDATE dealer_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .bind(body.status, id)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse("Application not found", 404, ctx.request);
    }

    return jsonResponse({
      success: true,
      message: `Application ${body.status}`,
    }, 200, ctx.request);
  } catch (err) {
    console.error("Update application error:", err);
    return errorResponse("Failed to update application", 500, ctx.request);
  }
}

/**
 * GET /admin/analytics
 * Basic analytics: application counts, listings, etc.
 * Admin only.
 */
export async function handleAnalytics(ctx: RouteContext): Promise<Response> {
  const authError = await requireAdmin(ctx.request, ctx);
  if (authError) return authError;

  try {
    const [appsResult, listingsResult, enquiriesResult] = await Promise.all([
      ctx.env.DB.prepare(
        "SELECT status, COUNT(*) as count FROM dealer_applications GROUP BY status"
      ).all(),
      ctx.env.DB.prepare(
        "SELECT status, COUNT(*) as count FROM listings GROUP BY status"
      ).all(),
      ctx.env.DB.prepare(
        "SELECT COUNT(*) as total, DATE(created_at) as date FROM enquiries GROUP BY date ORDER BY date DESC LIMIT 30"
      ).all(),
    ]);

    return jsonResponse({
      applications: appsResult.results,
      listings: listingsResult.results,
      enquiries: enquiriesResult.results,
    }, 200, ctx.request);
  } catch (err) {
    console.error("Analytics error:", err);
    return errorResponse("Failed to fetch analytics", 500, ctx.request);
  }
}
