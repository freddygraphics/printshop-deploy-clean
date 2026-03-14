export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

/* ---------------- UPDATE USER ---------------- */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // 🔐 Solo admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = Number(params.id);

    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const { role, isActive } = await req.json();

    // ❌ Evitar que el admin se desactive a sí mismo
    if (Number(session.user.id) === userId && isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    /* -------- VALIDATE ROLE -------- */
    const allowedRoles = ["admin", "sales", "production", "staff"];

    const data: any = {};

    if (role && allowedRoles.includes(role)) {
      data.role = role;
    }

    if (typeof isActive === "boolean") {
      data.isActive = isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);

    return NextResponse.json(
      { error: "Server error updating user" },
      { status: 500 },
    );
  }
}
