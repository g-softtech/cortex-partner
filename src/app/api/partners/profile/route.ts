import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePartnerSession } from "@/lib/auth/session";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export async function PATCH(req: Request) {
  try {
    const { session } = await requirePartnerSession();
    const body = await req.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: result.error.errors },
        { status: 400 }
      );
    }

    const { name } = result.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return NextResponse.json({ success: true, name: updatedUser.name });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
