import { z } from "zod";
import { SupportCategory, SupportStatus } from "@prisma/client";

export const supportSubmissionSchema = z.object({
  category: z.nativeEnum(SupportCategory, {
    required_error: "Please select a support category",
  }),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(255, "Subject is too long"),
  description: z.string().min(10, "Please provide more details").max(5000, "Description is too long"),
  projectId: z.string().optional(), // Optional link to a specific project
});

export type SupportSubmissionInput = z.infer<typeof supportSubmissionSchema>;


export const adminSupportUpdateSchema = z.object({
  status: z.nativeEnum(SupportStatus, {
    required_error: "Status is required",
  }),
  adminResponse: z.string().optional(),
  internalNote: z.string().optional(),
});

export type AdminSupportUpdateInput = z.infer<typeof adminSupportUpdateSchema>;
