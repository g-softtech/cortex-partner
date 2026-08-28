import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal("").transform(() => undefined));

export const kickoffSaveSchema = z.object({
  // Required core business info
  businessName: z.string().min(1, "Business name is required.").max(255),
  businessDescription: z.string().min(1, "Business description is required.").max(5000),

  // Optional branding
  primaryColor:    optionalText(50),
  secondaryColor:  optionalText(50),
  brandGuidelines: optionalText(10000),

  // Optional content
  contentAbout:    optionalText(10000),
  contentServices: optionalText(10000),
  contentProducts: optionalText(10000),
  contactInfo:     optionalText(5000),
  socialLinks:     optionalText(5000),

  // Optional project details
  requiredPages:   optionalText(5000),
  agreedFeatures:  optionalText(5000),
  integrations:    optionalText(5000),
  domain:          optionalText(255),
  hostingStatus:   optionalText(500),
  designReferences:optionalText(5000),
});

export type KickoffSaveInput = z.infer<typeof kickoffSaveSchema>;

export const kickoffSubmitSchema = kickoffSaveSchema.extend({
  // Submission requires mandatory fields
  businessName: z.string().min(1, "Business name is required.").max(255),
  businessDescription: z.string().min(10, "Please provide a detailed business description.").max(5000),
});

export type KickoffSubmitInput = z.infer<typeof kickoffSubmitSchema>;

// Schema for file registration after a successful direct R2 upload
export const fileRegistrationSchema = z.object({
  projectId:       z.string().min(1),
  storageKey:      z.string().min(1),
  originalName:    z.string().min(1).max(255),
  contentType:     z.string().min(1),
  fileSize:        z.number().int().positive().max(10 * 1024 * 1024),
  category:        z.enum(["LOGO", "IMAGE", "DOCUMENT", "BRAND_GUIDELINES", "OTHER"]),
});

export type FileRegistrationInput = z.infer<typeof fileRegistrationSchema>;
