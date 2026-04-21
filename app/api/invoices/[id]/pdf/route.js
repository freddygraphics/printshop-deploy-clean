import { NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function GET(req, { params }) {
  const id = params.id;
  const path = `invoices/${id}.pdf`;

  try {
    const file = await head(path);

    if (file?.url) {
      return NextResponse.redirect(file.url); // ⚡ abre rápido
    }
  } catch (e) {}

  // fallback → HTML (rápido)
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/invoices/${id}/html`,
  );
}
