import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    env: {
      database: !!process.env.DATABASE_URL,
      nextauth: !!process.env.NEXTAUTH_SECRET,
    },
  });
}
