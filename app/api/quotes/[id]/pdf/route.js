import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = await params;

  if (!id) {
    return new NextResponse("Missing quote id", {
      status: 400,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  return NextResponse.redirect(`${baseUrl}/api/quotes/${id}/html`);
}
