import { describe, it, expect } from "vitest";
import { updatePartnerStatusSchema } from "@/lib/validations/partner";
import { PartnerStatus } from "@prisma/client";

function validateStateTransition(currentStatus: PartnerStatus, action: "SUSPEND" | "REACTIVATE" | "REVOKE"): { valid: boolean; targetStatus?: PartnerStatus; error?: string } {
  if (action === "SUSPEND") {
    if (currentStatus !== PartnerStatus.ACTIVE) {
      return { valid: false, error: `Cannot suspend partner with status ${currentStatus}.` };
    }
    return { valid: true, targetStatus: PartnerStatus.SUSPENDED };
  }
  if (action === "REACTIVATE") {
    if (currentStatus !== PartnerStatus.SUSPENDED) {
      return { valid: false, error: `Cannot reactivate partner with status ${currentStatus}.` };
    }
    return { valid: true, targetStatus: PartnerStatus.ACTIVE };
  }
  if (action === "REVOKE") {
    if (currentStatus === PartnerStatus.INACTIVE) {
      return { valid: false, error: "Partner account is already revoked/inactive." };
    }
    return { valid: true, targetStatus: PartnerStatus.INACTIVE };
  }
  return { valid: false, error: "Invalid action." };
}

describe("Partner Lifecycle Schema Validation", () => {
  it("accepts valid SUSPEND action", () => {
    const res = updatePartnerStatusSchema.safeParse({ action: "SUSPEND", reason: "Policy review" });
    expect(res.success).toBe(true);
  });

  it("accepts valid REACTIVATE action", () => {
    const res = updatePartnerStatusSchema.safeParse({ action: "REACTIVATE" });
    expect(res.success).toBe(true);
  });

  it("accepts valid REVOKE action", () => {
    const res = updatePartnerStatusSchema.safeParse({ action: "REVOKE", reason: "Contract breach" });
    expect(res.success).toBe(true);
  });

  it("rejects invalid action name", () => {
    const res = updatePartnerStatusSchema.safeParse({ action: "UNSUSPEND" });
    expect(res.success).toBe(false);
  });
});

describe("Partner Lifecycle State Machine Rules", () => {
  it("permits ACTIVE -> SUSPENDED", () => {
    const res = validateStateTransition(PartnerStatus.ACTIVE, "SUSPEND");
    expect(res.valid).toBe(true);
    expect(res.targetStatus).toBe(PartnerStatus.SUSPENDED);
  });

  it("permits SUSPENDED -> ACTIVE", () => {
    const res = validateStateTransition(PartnerStatus.SUSPENDED, "REACTIVATE");
    expect(res.valid).toBe(true);
    expect(res.targetStatus).toBe(PartnerStatus.ACTIVE);
  });

  it("permits ACTIVE -> INACTIVE (Revoke)", () => {
    const res = validateStateTransition(PartnerStatus.ACTIVE, "REVOKE");
    expect(res.valid).toBe(true);
    expect(res.targetStatus).toBe(PartnerStatus.INACTIVE);
  });

  it("permits SUSPENDED -> INACTIVE (Revoke)", () => {
    const res = validateStateTransition(PartnerStatus.SUSPENDED, "REVOKE");
    expect(res.valid).toBe(true);
    expect(res.targetStatus).toBe(PartnerStatus.INACTIVE);
  });

  it("PROHIBITS INACTIVE -> ACTIVE", () => {
    const res = validateStateTransition(PartnerStatus.INACTIVE, "REACTIVATE");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Cannot reactivate partner with status INACTIVE");
  });

  it("PROHIBITS INACTIVE -> SUSPENDED", () => {
    const res = validateStateTransition(PartnerStatus.INACTIVE, "SUSPEND");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Cannot suspend partner with status INACTIVE");
  });

  it("PROHIBITS INACTIVE -> INACTIVE (Duplicate Revoke)", () => {
    const res = validateStateTransition(PartnerStatus.INACTIVE, "REVOKE");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("already revoked/inactive");
  });
});
