import { db } from "../src/lib/db";
import { UserRole } from "@prisma/client";

async function runSecurityTests() {
  console.log("Running Phase 5 Security Tests...");

  // 1. Verify Partner Role Enum exists and is used
  const partnerRole = UserRole.PARTNER;
  console.log("✅ UserRole.PARTNER enum exists:", partnerRole);

  // 2. Verify we are not selecting adminNotes anywhere in the partner dashboard
  const fs = require("fs");
  const path = require("path");
  const projectDetailPage = fs.readFileSync(
    path.join(__dirname, "../src/app/(dashboard)/projects/[id]/page.tsx"),
    "utf-8"
  );
  
  if (projectDetailPage.includes("adminNotes: true")) {
    throw new Error("❌ SECURITY LEAK: adminNotes is being selected in the partner project detail page!");
  }
  if (projectDetailPage.includes("opportunityStatus: true")) {
    throw new Error("❌ SECURITY LEAK: opportunityStatus is being selected in the partner project detail page!");
  }
  console.log("✅ adminNotes and opportunityStatus are correctly excluded from Prisma select");

  // 3. Verify IDOR protection in project detail page
  if (!projectDetailPage.includes("project.partnerId !== partner.id")) {
    throw new Error("❌ IDOR VULNERABILITY: Ownership check missing in project detail page!");
  }
  console.log("✅ Server-side IDOR protection is present in project detail page");

  // 4. Verify Middleware protections
  const middleware = fs.readFileSync(path.join(__dirname, "../src/middleware.ts"), "utf-8");
  if (!middleware.includes("token.role !== UserRole.PARTNER")) {
    throw new Error("❌ MIDDLEWARE VULNERABILITY: PARTNER role is not explicitly enforced!");
  }
  console.log("✅ Middleware explicitly enforces PARTNER role for dashboard routes");

  // 5. Verify requirePartnerSession checks Partner record
  const session = fs.readFileSync(path.join(__dirname, "../src/lib/auth/session.ts"), "utf-8");
  if (!session.includes("db.partner.findUnique")) {
    throw new Error("❌ SESSION VULNERABILITY: Partner record is not being verified in session!");
  }
  console.log("✅ requirePartnerSession verifies underlying Partner database record");

  console.log("\nAll static security checks passed successfully! 🎉");
}

runSecurityTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
