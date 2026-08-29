import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/services/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Vitest setup.ts clears rateLimitMap
  });

  it('allows requests under the limit', async () => {
    const res1 = await checkRateLimit('test_ip', 2, 1000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = await checkRateLimit('test_ip', 2, 1000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it('blocks requests over the limit', async () => {
    await checkRateLimit('spam_ip', 1, 1000);
    const blocked = await checkRateLimit('spam_ip', 1, 1000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets after the window expires', async () => {
    vi.useFakeTimers();
    await checkRateLimit('time_ip', 1, 1000);
    
    // Fast-forward 1.1 seconds
    vi.advanceTimersByTime(1100);

    const res = await checkRateLimit('time_ip', 1, 1000);
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(0);
    
    vi.useRealTimers();
  });
});
