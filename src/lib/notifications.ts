import { NotificationType, Prisma } from "@prisma/client";
import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface NotifyUserParams {
  tx: Prisma.TransactionClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  email?: {
    to: string;
    subject: string;
    html: string;
  };
}

/**
 * Creates an in-app notification reliably within a transaction.
 * If an email payload is provided, returns a dispatcher function that should be
 * invoked *after* the transaction successfully commits.
 * 
 * This ensures:
 * 1. Notification creation is atomically bound to the business operation.
 * 2. Emails are never sent if the transaction rolls back.
 * 3. Email network failures do not break the transaction or roll it back.
 * 
 * @returns A function to execute after the transaction commits to actually send the email.
 */
export async function notifyUser(params: NotifyUserParams, skipInApp: boolean = false): Promise<() => Promise<void>> {
  // 1. Create the in-app notification reliably within the provided transaction
  if (!skipInApp) {
    await params.tx.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });
  }

  // 2. Return the email dispatcher
  return async () => {
    if (params.email && process.env.RESEND_API_KEY && resend) {
      try {
        const { error } = await resend.emails.send({
          from: "Cortex Partner Program <build@thecortexsystems.com>",
          to: params.email!.to,
          subject: params.email!.subject,
          html: params.email!.html,
        });
        
        if (error) {
          console.error(`Resend API error sending email to ${params.email!.to}:`, error);
        }
      } catch (err) {
        console.error(`Failed to send email to ${params.email!.to}:`, err);
      }
    }
  };
}

export async function notifyAdmins(params: Omit<NotifyUserParams, "userId" | "email"> & { email?: { subject: string; html: string } }): Promise<() => Promise<void>> {
  const admins = await params.tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });

  const dispatchers: (() => Promise<void>)[] = [];

  for (const admin of admins) {
    const dispatch = await notifyUser({
      ...params,
      userId: admin.id,
      email: params.email ? {
        ...params.email,
        to: admin.email,
      } : undefined,
    });
    dispatchers.push(dispatch);
  }

  return async () => {
    await Promise.all(dispatchers.map(d => d()));
  };
}
