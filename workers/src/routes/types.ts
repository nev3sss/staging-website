/**
 * routes/types.ts — Shared type definitions for route handlers.
 */
import type { Env } from "../index";

export interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  /** Worker execution context — use waitUntil() for fire-and-forget work like emails. */
  executionCtx: ExecutionContext;
}
