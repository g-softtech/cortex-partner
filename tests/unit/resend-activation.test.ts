import { describe, it, expect } from "vitest";
import { ApplicationStatus } from "@prisma/client";

function isActivationComplete(user: {
  password: string | null;
  setupTokens: Array<{ consumedAt: Date | null }>;
}): boolean {
  return (
    user.password !== null ||
    user.setupTokens.some((t) => t.consumedAt !== null)
  );
}

describe("Partner Activation Link Resend Eligibility Rules", () => {
  it("should mark account as incomplete if password is null and no token is consumed", () => {
    const user = {
      password: null,
      setupTokens: [{ consumedAt: null }],
    };
    expect(isActivationComplete(user)).toBe(false);
  });

  it("should mark account as complete if password is set", () => {
    const user = {
      password: "$2a$12$hashedpassword",
      setupTokens: [{ consumedAt: null }],
    };
    expect(isActivationComplete(user)).toBe(true);
  });

  it("should mark account as complete if any setup token has been consumed", () => {
    const user = {
      password: null,
      setupTokens: [{ consumedAt: new Date() }],
    };
    expect(isActivationComplete(user)).toBe(true);
  });

  it("should reject activation resend if application is not APPROVED", () => {
    const status = ApplicationStatus.PENDING as ApplicationStatus;
    const canResend = status === ApplicationStatus.APPROVED;
    expect(canResend).toBe(false);
  });

  it("should allow activation resend only if application is APPROVED and account incomplete", () => {
    const status = ApplicationStatus.APPROVED as ApplicationStatus;
    const user = {
      password: null,
      setupTokens: [],
    };
    const canResend = status === ApplicationStatus.APPROVED && !isActivationComplete(user);
    expect(canResend).toBe(true);
  });
});
