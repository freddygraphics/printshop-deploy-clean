export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { id } = params;

  const isDev = process.env.NODE_ENV === "development";

  // 🟢 LOCAL → abre HTML
  if (isDev) {
    return Response.redirect(`http://localhost:3000/api/invoices/${id}/html`);
  }

  const apiKey = process.env.PDFSHIFT_API_KEY;

  const htmlUrl = `https://app.freddygraphics.com/api/invoices/${id}/html`;

  const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey, // 🔥 ESTE ES EL FIX
    },
    body: JSON.stringify({
      source: htmlUrl,
      use_print: true,
      format: "A4",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("PDFShift RAW:", err);
    throw new Error(err);
  }

  const pdf = await response.arrayBuffer();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
