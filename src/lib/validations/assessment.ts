import { z } from "zod";
import { OpportunityStatus, ProjectStatus } from "@prisma/client";

/**
 * Validates a monetary decimal string: digits, optional dot, up to 2 decimal places.
 * e.g. "150000.00", "9999.99", "100"
 * We avoid z.number() to prevent JavaScript floating-point precision errors.
 * The string is safely converted to Prisma Decimal on the server.
 */
const decimalStringSchema = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,2})?$/,
    "Partner price must be a valid number with up to 2 decimal places (e.g. 1500.00)"
  )
  .refine(
    (val) => parseFloat(val) > 0,
    "Partner price must be greater than 0"
  );

export const assessmentSchema = z.object({
  partnerPrice:      decimalStringSchema.optional(),
  estimatedTimeline: z.string().max(255).optional(),
  scope:             z.string().max(10000).optional(),
  adminNotes:        z.string().max(10000).optional(),
  opportunityStatus: z.nativeEnum(OpportunityStatus).optional(),
  newStatus:         z.nativeEnum(ProjectStatus).optional(),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;
