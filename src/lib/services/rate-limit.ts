/**
 * Simple In-Memory Rate Limiter
 * 
 * IMPORTANT: This is an instance-local, best-effort rate limiter.
 * Vercel Serverless Functions do NOT share memory across instances.
 * This will NOT provide a guaranteed global per-IP limit across all instances.
 * 
 * It is implemented to provide basic burst/spam protection against 
 * high-volume automated requests hitting the same warm function instance.
 * 
 * If a true global rate limit is required (e.g. for DDoS protection or 
 * strict business rules), a distributed store like Redis (Upstash) 
 * should be swapped into this service interface.
 */

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// Use globalThis to persist the map across warm invocations of the serverless function
declare const globalThis: {
  rateLimitMap: Map<string, RateLimitRecord>;
} & typeof global;

const rateLimitMap = globalThis.rateLimitMap ?? new Map<string, RateLimitRecord>();
if (process.env.NODE_ENV !== 'production') globalThis.rateLimitMap = rateLimitMap;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks if the request should be rate limited.
 * @param identifier e.g. IP address or user ID
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000 // default 1 minute
): Promise<RateLimitResult> {
  const now = Date.now();
  let record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    // New or expired window
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(identifier, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: record.resetAt,
    };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  // Increment and allow
  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetAt,
  };
}
