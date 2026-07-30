import { NextResponse } from "next/server";
import { head } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const id = params.id;
  const path = `invoices/${id}.pdf`;

  try {
    const file = await head(path);

    if (file?.url) {
      return NextResponse.redirect(file.url);
    }
  } catch (err) {
    console.error(err);
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/invoices/${id}/html`,
  );
}
