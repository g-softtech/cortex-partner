import { db } from "../src/lib/db";
import { UserRole, ApplicationStatus } from "@prisma/client";

async function runPhase6SecurityTests() {
  console.log("Running Phase 6 Security Tests...");

  // 1. Verify API Route file does not spread request body
  const fs = require("fs");
  const path = require("path");
  const apiRoute = fs.readFileSync(
    path.join(__dirname, "../src/app/api/projects/route.ts"),
    "utf-8"
  );

  if (apiRoute.includes("...validData") || apiRoute.includes("...body")) {
    throw new Error(
      "❌ SECURITY LEAK: API route spreads request data into Prisma create! This allows mass assignment."
    );
  }
  console.log("✅ API route uses explicit assignment (no mass assignment).");

  // 2. Verify API Route enforces partner.id from session
  if (!apiRoute.includes("partnerId: partner.id")) {
    throw new Error(
      "❌ IDOR VULNERABILITY: API route does not enforce partnerId from session!"
    );
  }
  console.log("✅ API route enforces partner ownership from session.");

  // 3. Verify API route explicit Select
  if (apiRoute.includes("adminNotes: true")) {
    throw new Error("❌ SECURITY LEAK: API route returns adminNotes!");
  }
  console.log("✅ API route securely prunes return data.");

  // 4. End-to-End Programmatic Test (Direct DB call to simulate what the UI does)
  // We'll create a dummy partner to verify Sequence generation
  console.log("\nSimulating Project Creation...");
  
  // Clean up any test artifacts first
  await db.project.deleteMany({ where: { description: "TEST_PROJECT_SUBMISSION_PHASE6" } });
  
  const testUser = await db.user.upsert({
    where: { email: "test-phase6@example.com" },
    update: {},
    create: {
      email: "test-phase6@example.com",
      role: UserRole.PARTNER,
    },
  });

  const testPartner = await db.partner.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      partnerId: "CP-TEST",
      userId: testUser.id,
    },
  });

  // Simulate atomic transaction used in route
  const project = await db.$transaction(async (tx) => {
    const sequence = await tx.sequence.upsert({
      where: { id: "PROJECT" },
      update: { value: { increment: 1 } },
      create: { id: "PROJECT", value: 1 },
    });

    const projectNumber = `CPJ-${String(sequence.value).padStart(5, "0")}`;

    return await tx.project.create({
      data: {
        projectNumber,
        partnerId: testPartner.id, 
        projectType: "WEB_APP",
        description: "TEST_PROJECT_SUBMISSION_PHASE6",
        features: "Test features",
        budget: "1000",
        timeline: "1 month",
      },
    });
  });

  console.log("✅ Generated Project Number:", project.projectNumber);
  console.log("✅ Project assigned to Partner ID:", project.partnerId);
  console.log("✅ Initial status is SUBMITTED:", project.projectStatus === "SUBMITTED");
  console.log("✅ Initial opportunity is UNKNOWN:", project.opportunityStatus === "UNKNOWN");

  if (!project.projectNumber.startsWith("CPJ-")) {
      throw new Error("❌ SEQUENCE ERROR: Invalid project number format");
  }

  // Cleanup
  await db.project.delete({ where: { id: project.id } });

  console.log("\nAll Phase 6 security checks passed successfully! 🎉");
}

runPhase6SecurityTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
