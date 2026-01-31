import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 🔒 PATCH — Update user (ADMIN)
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 Solo admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = Number(params.id);
    const { role, isActive } = await req.json();

    // 🛑 Validación básica
    if (!userId) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // ❌ Evitar que el admin se desactive a sí mismo
    if (session.user.id === userId && isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    // 🛠 Construir data dinámica
    const data = {};
    if (role) data.role = role;
    if (typeof isActive === "boolean") data.isActive = isActive;

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
    console.error("❌ Update user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
