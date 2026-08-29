import { z } from "zod";

export const partnerApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string().min(7, "Please enter a valid phone number").max(20),
  occupation: z.string().min(2, "Occupation is required").max(100),
  hasPotentialClients: z.preprocess((val) => {
    if (typeof val === "string") return val === "true";
    return Boolean(val);
  }, z.boolean({
    required_error: "Please specify if you have potential clients",
  })),
  potentialClientType: z.string().max(255).optional(),
  reason: z.string().min(10, "Please provide more detail about why you want to join").max(2000),
  source: z.string().max(100).optional(),
});

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
