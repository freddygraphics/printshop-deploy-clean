import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const pdfFile = formData.get("pdf");
    const fileName = formData.get("fileName");

    if (!pdfFile) {
      return Response.json({ error: "Missing PDF" }, { status: 400 });
    }

    // ==========================================
    // SAFE FILE NAME
    // ==========================================
    const safeFileName = String(fileName || "document.pdf")
      .replace(/[<>:"/\\|?*]/g, "")
      .trim();

    const pdfBytes = await pdfFile.arrayBuffer();

    // ==========================================
    // UNIQUE FILE
    // ==========================================
    const uniqueName = `temp-pdf/${safeFileName}`;

    const blob = await put(uniqueName, pdfBytes, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });

    // ==========================================
    // RETURN URL
    // ==========================================
    return Response.json({
      ok: true,
      url: blob.url,
      fileName: safeFileName,
    });
  } catch (error) {
    console.error("❌ Document PDF route error:", error);

    return Response.json(
      {
        error: "Could not prepare PDF",
      },
      {
        status: 500,
      },
    );
  }
}
