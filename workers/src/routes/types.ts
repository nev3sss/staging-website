/**
 * routes/types.ts — Shared type definitions for route handlers.
 */

export interface RouteContext {
  request: Request;
  env: {
    DB: D1Database;
    DEALER_DOCS: R2Bucket;
    LISTING_MEDIA: R2Bucket;
    FEATURE_FLAGS: KVNamespace;
    CONFIG: KVNamespace;
    TURNSTILE_SECRET_KEY: string;
  };
  params: Record<string, string>;
}
