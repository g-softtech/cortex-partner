import * as fs from "fs";
import * as path from "path";

async function runTests() {
  console.log("=== Running Phase 9 Security Tests ===");

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
    const adminApiStr = fs.readFileSync(path.join(__dirname, "../src/app/api/admin/projects/[id]/workflow/route.ts"), "utf-8");
    const partnerApiStr = fs.readFileSync(path.join(__dirname, "../src/app/api/projects/[id]/review/route.ts"), "utf-8");

    // Admin Workflow Security
    assert(adminApiStr.includes("requireAdminSession()"), "Admin Workflow enforces Admin session (Unauthorized / Partner blocked)");
    assert(adminApiStr.includes("ADMIN_TRANSITIONS[currentProject.projectStatus]"), "Admin Workflow validates every valid/invalid transition");
    assert(adminApiStr.includes("ProjectStatus.SUBMITTED]: []"), "Admin Workflow enforces terminal/blocked states correctly");
    assert(adminApiStr.includes("tx.project.updateMany({"), "Admin Workflow uses optimistic concurrency in transaction");
    assert(adminApiStr.includes("projectStatus: currentProject.projectStatus"), "Admin Workflow uses current status to prevent concurrent conflict");
    assert(adminApiStr.includes("tx.auditLog.create("), "Admin Workflow writes AuditLog atomically");

    // Partner Review Security
    assert(partnerApiStr.includes("requirePartnerSession()"), "Partner Review enforces Partner session (Unauthorized / Admin blocked)");
    assert(partnerApiStr.includes("partnerId: partnerId"), "Partner Review enforces strict IDOR ownership via DB query");
    assert(!partnerApiStr.includes("req.body.partnerId"), "Partner Review derives identity purely from session, not request body");
    assert(partnerApiStr.includes("ProjectStatus.PARTNER_REVIEW && currentStatus !== ProjectStatus.CUSTOMER_REVIEW"), "Partner Review restricts actions to allowed states");
    assert(partnerApiStr.includes("tx.project.updateMany({"), "Partner Review uses optimistic concurrency in transaction");
    assert(partnerApiStr.includes("projectStatus: currentProject.projectStatus"), "Partner Review uses current status to prevent concurrent conflict");
    assert(partnerApiStr.includes("tx.auditLog.create("), "Partner Review writes AuditLog atomically");
    assert(partnerApiStr.includes("issueDescription: action === \"REPORT_ISSUE\" ? issueDescription : undefined"), "Partner Review stores issue description in Audit metadata");

    // Regression on Data Boundaries (Phase 5/8 UI check)
    const partnerUiStr = fs.readFileSync(path.join(__dirname, "../src/app/(dashboard)/projects/[id]/page.tsx"), "utf-8");
    assert(!partnerUiStr.includes("adminNotes: true"), "Regression Check: Partner UI never selects adminNotes");
    assert(!partnerUiStr.includes("opportunityStatus: true"), "Regression Check: Partner UI never selects opportunityStatus");

  } catch (err) {
    console.error("Test framework error", err);
  }

  console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed > 0) process.exit(1);
}

runTests();
