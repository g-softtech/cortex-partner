import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdminSession, requirePartnerSession, isAuthError } from '@/lib/auth/session';
import * as nextAuth from 'next-auth/next';
import { UserRole } from '@prisma/client';

// Mock next-auth/next
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Authorization Session Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAdminSession', () => {
    it('throws 401 if no session exists', async () => {
      vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(null);
      
      try {
        await requireAdminSession();
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(isAuthError(err)).toBe(true);
        expect(err.status).toBe(401);
      }
    });

    it('throws 403 if user is not ADMIN', async () => {
      vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce({
        user: { id: '1', role: UserRole.PARTNER },
      } as any);

      try {
        await requireAdminSession();
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(isAuthError(err)).toBe(true);
        expect(err.status).toBe(403);
      }
    });

    it('returns session if user is ADMIN', async () => {
      const mockSession = { user: { id: '1', role: UserRole.ADMIN } };
      vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(mockSession as any);

      const session = await requireAdminSession();
      expect(session).toEqual(mockSession);
    });
  });

  describe('requirePartnerSession', () => {
    // We mock the DB call that fetches the partner record inside requirePartnerSession
    vi.mock('@/lib/db', () => ({
      db: {
        partner: {
          findUnique: vi.fn(),
        },
      },
    }));

    it('throws 401 if no session exists', async () => {
      vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce(null);
      
      try {
        await requirePartnerSession();
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(isAuthError(err)).toBe(true);
        expect(err.status).toBe(401);
      }
    });

    it('throws 403 if user is not PARTNER', async () => {
      vi.mocked(nextAuth.getServerSession).mockResolvedValueOnce({
        user: { id: '1', role: UserRole.ADMIN },
      } as any);

      try {
        await requirePartnerSession();
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(isAuthError(err)).toBe(true);
        expect(err.status).toBe(403);
      }
    });
  });
});
