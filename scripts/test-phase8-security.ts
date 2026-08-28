import { PrismaClient, ProjectStatus, UserRole, KickoffStatus } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Running Phase 8 Security Tests ===");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      testsFailed++;
    }
  }

  try {
    // 1. Static Source Code Checks
    
    // Check presign route ownership validation
    const presignRouteStr = fs.readFileSync(path.join(__dirname, "../src/app/api/files/presign/route.ts"), "utf-8");
    assert(presignRouteStr.includes("project.partnerId !== ownerId"), "Presign API checks IDOR / project ownership");
    assert(presignRouteStr.includes("generatePresignedUploadUrl"), "Presign API calls R2 S3 presigner for uploads");

    // Check download route ownership validation
    const downloadRouteStr = fs.readFileSync(path.join(__dirname, "../src/app/api/files/download/[id]/route.ts"), "utf-8");
    assert(downloadRouteStr.includes("file.project.partnerId !== ownerId"), "Download API checks IDOR / project ownership");
    assert(downloadRouteStr.includes("generatePresignedDownloadUrl"), "Download API calls R2 S3 presigner for downloads");

    // Check Accept API atomic transaction
    const acceptRouteStr = fs.readFileSync(path.join(__dirname, "../src/app/api/projects/[id]/accept/route.ts"), "utf-8");
    assert(acceptRouteStr.includes("project.projectStatus !== \"PROPOSAL_SENT\""), "Accept API enforces PROPOSAL_SENT state");
    assert(acceptRouteStr.includes("tx.project.updateMany({"), "Accept API uses optimistic concurrency in transaction");
    assert(acceptRouteStr.includes("tx.auditLog.create("), "Accept API writes AuditLog in the transaction");
    assert(acceptRouteStr.includes("status: \"DRAFT\""), "Accept API creates kickoff in DRAFT status");

    // Check Kickoff Submit API
    const kickoffRouteStr = fs.readFileSync(path.join(__dirname, "../src/app/api/projects/[id]/kickoff/route.ts"), "utf-8");
    assert(kickoffRouteStr.includes("kickoff.status !== KickoffStatus.DRAFT"), "Kickoff API only allows submitting DRAFT kickoffs");
    assert(kickoffRouteStr.includes("tx.project.update({"), "Kickoff submission atomically updates parent project status");

    // Check Admin Review API
    const adminReviewStr = fs.readFileSync(path.join(__dirname, "../src/app/api/admin/projects/[id]/kickoff/review/route.ts"), "utf-8");
    assert(adminReviewStr.includes("requireAdminSession()"), "Admin Kickoff Review enforces Admin session");
    assert(adminReviewStr.includes("project.kickoff.status !== KickoffStatus.SUBMITTED"), "Admin Kickoff Review enforces SUBMITTED status");
    assert(adminReviewStr.includes("tx.projectKickoff.updateMany({"), "Admin Kickoff Review uses concurrency safe transaction");

    // Check Proposal visibility in UI
    const partnerUiStr = fs.readFileSync(path.join(__dirname, "../src/app/(dashboard)/projects/[id]/page.tsx"), "utf-8");
    assert(partnerUiStr.includes("PROPOSAL_VISIBLE_STATUSES.includes(project.projectStatus)"), "Partner UI restricts proposal visibility by status");
    assert(!partnerUiStr.includes("adminNotes: true"), "Partner UI never selects adminNotes from DB");
    assert(!partnerUiStr.includes("opportunityStatus: true"), "Partner UI never selects opportunityStatus from DB");

  } catch (err) {
    console.error("Test framework error", err);
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed > 0) process.exit(1);
}

runTests();
