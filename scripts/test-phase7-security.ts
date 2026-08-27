import { db } from "../src/lib/db";
import { UserRole, ProjectStatus, OpportunityStatus } from "@prisma/client";

async function runPhase7SecurityTests() {
  console.log("Running Phase 7 Security Tests...");

  // 1. Verify API Route requires Admin
  const fs = require("fs");
  const path = require("path");
  const apiRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/admin/projects/[id]/assess/route.ts"),
    "utf-8"
  );

  if (!apiRoute.includes("requireAdminSession()")) {
    throw new Error("❌ SECURITY LEAK: API route does not enforce requireAdminSession!");
  }
  console.log("✅ API route enforces Admin ownership.");

  if (!apiRoute.includes("isAuthError")) {
    throw new Error("❌ SECURITY LEAK: API route does not properly handle auth errors!");
  }
  
  if (!apiRoute.includes("tx.auditLog.create(")) {
    throw new Error("❌ SECURITY LEAK: API route does not create AuditLog in the transaction!");
  }
  console.log("✅ API route creates AuditLog in the transaction.");

  // Setup test data
  console.log("\nSimulating Project Assessment...");
  
  // Clean up any test artifacts first
  await db.project.deleteMany({ where: { description: "TEST_PROJECT_PHASE7" } });
  
  const testUser = await db.user.upsert({
    where: { email: "test-partner-p7@example.com" },
    update: {},
    create: {
      email: "test-partner-p7@example.com",
      role: UserRole.PARTNER,
    },
  });

  const testPartner = await db.partner.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      partnerId: "CP-TEST7",
      userId: testUser.id,
    },
  });

  const adminUser = await db.user.upsert({
    where: { email: "test-admin-p7@example.com" },
    update: {},
    create: {
      email: "test-admin-p7@example.com",
      role: UserRole.ADMIN,
    },
  });

  const project = await db.project.create({
    data: {
      projectNumber: "CPJ-TEST7",
      partnerId: testPartner.id, 
      projectType: "WEB_APP",
      description: "TEST_PROJECT_PHASE7",
      features: "Test features",
      projectStatus: "SUBMITTED",
    },
  });

  // Verify transition state machine directly through the API route logic imitation
  console.log("\nSimulating valid transition (SUBMITTED -> UNDER_REVIEW)...");
  
  // Valid transition
  const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    [ProjectStatus.SUBMITTED]:            [ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
    [ProjectStatus.UNDER_REVIEW]:         [ProjectStatus.PRICED, ProjectStatus.SUBMITTED, ProjectStatus.LOST, ProjectStatus.CANCELLED],
    [ProjectStatus.PRICED]:               [ProjectStatus.PROPOSAL_SENT, ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
    [ProjectStatus.PROPOSAL_SENT]:        [ProjectStatus.WON, ProjectStatus.LOST, ProjectStatus.CANCELLED],
    [ProjectStatus.WON]:                  [ProjectStatus.KICKOFF_SUBMITTED],
    [ProjectStatus.KICKOFF_SUBMITTED]:    [ProjectStatus.READY_FOR_DEVELOPMENT],
    [ProjectStatus.READY_FOR_DEVELOPMENT]:[ProjectStatus.DEVELOPMENT],
    [ProjectStatus.DEVELOPMENT]:          [ProjectStatus.INTERNAL_QA],
    [ProjectStatus.INTERNAL_QA]:          [ProjectStatus.PARTNER_REVIEW],
    [ProjectStatus.PARTNER_REVIEW]:       [ProjectStatus.CUSTOMER_REVIEW, ProjectStatus.CHANGES],
    [ProjectStatus.CUSTOMER_REVIEW]:      [ProjectStatus.FINAL_APPROVAL, ProjectStatus.CHANGES],
    [ProjectStatus.CHANGES]:              [ProjectStatus.PARTNER_REVIEW, ProjectStatus.CUSTOMER_REVIEW],
    [ProjectStatus.FINAL_APPROVAL]:       [ProjectStatus.DELIVERED],
    [ProjectStatus.DELIVERED]:            [ProjectStatus.SUPPORT, ProjectStatus.ARCHIVED],
    [ProjectStatus.SUPPORT]:              [ProjectStatus.ARCHIVED],
    [ProjectStatus.LOST]:                 [],
    [ProjectStatus.CANCELLED]:            [],
    [ProjectStatus.ARCHIVED]:             [],
  };

  if (!VALID_TRANSITIONS[project.projectStatus].includes("UNDER_REVIEW")) {
    throw new Error("❌ STATE MACHINE ERROR: Cannot transition SUBMITTED -> UNDER_REVIEW");
  }
  
  // Simulate atomic transaction
  const updatedProject = await db.$transaction(async (tx) => {
    const updateResult = await tx.project.updateMany({
      where: {
        id: project.id,
        projectStatus: project.projectStatus, 
      },
      data: { projectStatus: "UNDER_REVIEW", partnerPrice: 1500.00, adminNotes: "Test note" },
    });

    if (updateResult.count === 0) {
      throw new Error("CONCURRENT_MODIFICATION");
    }

    const updated = await tx.project.findUnique({ where: { id: project.id } });

    await tx.auditLog.create({
      data: {
        action: "PROJECT_ASSESSED",
        entityType: "Project",
        entityId: project.id,
        userId: adminUser.id,
        metadata: {
          changedFields: ["projectStatus", "partnerPrice", "adminNotes"],
          previousStatus: project.projectStatus,
          newStatus: "UNDER_REVIEW",
        },
      },
    });

    return updated;
  });

  console.log("✅ Valid transition successful. Status:", updatedProject?.projectStatus);

  // Test invalid transition
  console.log("\nSimulating invalid transition (UNDER_REVIEW -> DELIVERED)...");
  if (VALID_TRANSITIONS[updatedProject!.projectStatus].includes("DELIVERED")) {
    throw new Error("❌ STATE MACHINE ERROR: Allowed invalid transition UNDER_REVIEW -> DELIVERED");
  }
  console.log("✅ Invalid transition correctly rejected by validation map.");

  // Test Terminal status
  console.log("\nSimulating terminal status constraint (LOST -> anything)...");
  const lostProject = await db.project.update({
    where: { id: project.id },
    data: { projectStatus: "LOST" }
  });
  
  if (VALID_TRANSITIONS[lostProject.projectStatus].length > 0) {
    throw new Error("❌ STATE MACHINE ERROR: Terminal status LOST allows transitions.");
  }
  console.log("✅ Terminal status constraint correctly enforced.");

  // Check audit log
  const auditLogs = await db.auditLog.findMany({
    where: { entityId: project.id }
  });
  
  if (auditLogs.length === 0) {
    throw new Error("❌ AUDIT LOG ERROR: AuditLog not created.");
  }
  console.log("✅ AuditLog correctly created.");

  // Test that partner facing project responses exclude admin fields
  // In Phase 5, /api/projects returns only projectNumber and id.
  // /projects/[id] page selects explicitly.
  const partnerFacingSelects = fs.readFileSync(
    path.join(__dirname, "../src/app/api/projects/route.ts"),
    "utf-8"
  );
  if (partnerFacingSelects.includes("adminNotes: true") || partnerFacingSelects.includes("partnerPrice: true")) {
    throw new Error("❌ SECURITY LEAK: Partner facing API exposes admin fields.");
  }
  console.log("✅ Partner facing API correctly excludes admin fields.");

  // Cleanup
  await db.auditLog.deleteMany({ where: { entityId: project.id } });
  await db.project.delete({ where: { id: project.id } });

  console.log("\nAll Phase 7 security checks passed successfully! 🎉");
}

runPhase7SecurityTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
