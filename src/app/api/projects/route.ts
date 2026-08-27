import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { projectSubmissionSchema } from "@/lib/validations/project";
import { requirePartnerSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    // 1. Authentication and Authorization
    // requirePartnerSession explicitly checks the user role is PARTNER
    // and that a Partner record exists. It throws an error if unauthorized.
    const { partner } = await requirePartnerSession();

    // 2. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    // Allow 5 submissions per 5 minutes to prevent spam but not block normal use
    const rateLimit = await checkRateLimit(`project_${ip}`, 5, 5 * 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 3. Validation
    const body = await req.json();
    const result = projectSubmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid project data", issues: result.error.errors },
        { status: 400 }
      );
    }

    const validData = result.data;

    // 4. Atomic Sequence Increment & Project Creation
    const project = await db.$transaction(async (tx) => {
      const sequence = await tx.sequence.upsert({
        where: { id: "PROJECT" },
        update: { value: { increment: 1 } },
        create: { id: "PROJECT", value: 1 },
      });

      const projectNumber = `CPJ-${String(sequence.value).padStart(5, "0")}`;

      // CRITICAL: We enforce the partnerId exclusively from the server-side session.
      // We NEVER spread the request body. We explicitly assign approved fields.
      return await tx.project.create({
        data: {
          projectNumber,
          partnerId: partner.id, // Sourced from requirePartnerSession
          projectType: validData.projectType,
          description: validData.description,
          features: validData.features,
          budget: validData.budget ?? null,
          timeline: validData.timeline ?? null,
          // Status fields fall back to Prisma defaults (SUBMITTED, UNKNOWN)
        },
        // We only select the minimal fields to return to the client.
        // We DO NOT select adminNotes, partnerPrice, or scope.
        select: {
          id: true,
          projectNumber: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        projectId: project.id, // Returned for UI navigation
        projectNumber: project.projectNumber,
        message: "Project submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    console.error("Project submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred submitting the project." },
      { status: 500 }
    );
  }
}
