import { z } from "zod";
import { ProjectType } from "@prisma/client";

export const projectSubmissionSchema = z.object({
  projectType: z.nativeEnum(ProjectType, {
    required_error: "Please select a project type",
  }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description is too long"),
  features: z
    .string()
    .min(10, "Please list the core features (at least 10 characters)")
    .max(5000, "Features list is too long"),
  budget: z.string().max(255).optional(),
  timeline: z.string().max(255).optional(),
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;
