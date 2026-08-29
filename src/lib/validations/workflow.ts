import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

// Admin transition schema
export const adminWorkflowSchema = z.object({
  newStatus: z.enum([
    ProjectStatus.DEVELOPMENT,
    ProjectStatus.INTERNAL_QA,
    ProjectStatus.PARTNER_REVIEW,
    ProjectStatus.DELIVERED,
  ]),
});

// Partner transition schema
export const partnerReviewSchema = z
  .object({
    action: z.enum(["APPROVE", "REPORT_ISSUE"]),
    issueDescription: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "REPORT_ISSUE") {
        return !!data.issueDescription && data.issueDescription.trim().length > 0;
      }
      return true;
    },
    {
      message: "An issue description is required when reporting an issue.",
      path: ["issueDescription"],
    }
  );

export type AdminWorkflowPayload = z.infer<typeof adminWorkflowSchema>;
export type PartnerReviewPayload = z.infer<typeof partnerReviewSchema>;
