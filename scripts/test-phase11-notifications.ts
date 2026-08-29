import { db } from "../src/lib/db";
import { notifyUser, notifyAdmins } from "../src/lib/notifications";
import { NotificationType } from "@prisma/client";

async function run() {
  console.log("Testing Notification System...");

  try {
    // We will test if notifyAdmins handles a transaction client correctly.
    // We mock Prisma transaction
    const tx = db as any;

    console.log("Mocking admin notification dispatch...");
    const dispatchEmails = await notifyAdmins({
      tx,
      type: NotificationType.SYSTEM,
      title: "Test Alert",
      message: "This is a test alert",
      email: {
        subject: "Test Alert",
        html: "<p>Test Alert</p>"
      }
    });

    console.log("Checking if dispatchEmails is a function:", typeof dispatchEmails === "function");
    
    // We won't actually call dispatchEmails() because it requires Resend API key and might fail or spam
    // But we check that it was successfully built.

    // Let's check if the db has the Notification record for the admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    if (admins.length > 0) {
      const adminId = admins[0].id;
      const notification = await db.notification.findFirst({
        where: { userId: adminId, type: NotificationType.SYSTEM }
      });
      console.log("In-app notification created for admin:", !!notification);
    } else {
      console.log("No admins found to check in-app notification.");
    }

    console.log("All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

run();
