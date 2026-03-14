export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";

/* ---------------- GET USERS ---------------- */
export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

/* ---------------- CREATE USER ---------------- */
export async function POST(req) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    const allowedRoles = ["admin", "sales", "production", "staff"];
    const safeRole = allowedRoles.includes(role) ? role : "staff";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: safeRole,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return NextResponse.json(
      { error: "Server error creating user" },
      { status: 500 },
    );
  }
}
