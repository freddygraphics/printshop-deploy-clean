export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { id } = params;

  // 👇 DETECTAR ENTORNO
  const isDev = process.env.NODE_ENV === "development";

  // 🟢 LOCAL → REDIRIGE AL HTML
  if (isDev) {
    return Response.redirect(`http://localhost:3000/api/invoices/${id}/html`);
  }

  // 🔥 PRODUCCIÓN → PDFSHIFT
  const apiKey = process.env.PDFSHIFT_API_KEY;

  const htmlUrl = `https://app.freddygraphics.com/api/invoices/${id}/html`;

  const response = await fetch(
    `https://api.pdfshift.io/v3/convert/pdf?api_key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: htmlUrl,
        use_print: true,
      }),
    },
  );

  const pdf = await response.arrayBuffer();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
