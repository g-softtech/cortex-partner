import { z } from "zod";
import { RequestStatus } from "@prisma/client";

// Used by partners to submit a change request
export const changeRequestSchema = z.object({
  description: z.string().min(10, "Please provide a detailed description of the requested changes."),
  // Optional files attached to the request
  files: z.array(z.object({
    storageKey: z.string().min(1),
    originalName: z.string().min(1),
    contentType: z.string().min(1),
    fileSize: z.number().int().positive(),
  })).optional(),
});

export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;

// Used by admins to manage/scope a change request
export const adminChangeRequestSchema = z.object({
  status: z.enum([
    RequestStatus.SUBMITTED,
    RequestStatus.UNDER_REVIEW,
    RequestStatus.IN_SCOPE,
    RequestStatus.ADDITIONAL_WORK,
    RequestStatus.IN_PROGRESS,
    RequestStatus.COMPLETED,
    RequestStatus.REJECTED,
  ]),
  explanation: z.string().optional(),
});

export type AdminChangeRequestInput = z.infer<typeof adminChangeRequestSchema>;
