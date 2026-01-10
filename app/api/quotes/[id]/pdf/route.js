// /app/api/quotes/[id]/pdf/route.js
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import playwright from "playwright";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    // 🧩 Cargar quote con cliente e ítems
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { client: true, items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const items = quote.items || [];

    // 🧩 Fechas
    const quoteDate = quote.quoteDate
      ? new Date(quote.quoteDate).toLocaleDateString()
      : "";

    const validUntil = quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString()
      : "";

    // 🧩 Downpayment 50%
    const deposit = Number(quote.total || 0) * 0.5;

    // 🧩 Logo en base64
    const logoPath = path.join(process.cwd(), "public/freddy-logo.png");
    let logoBase64 = "";
    try {
      logoBase64 = fs.readFileSync(logoPath).toString("base64");
    } catch (e) {
      console.warn("⚠️ Logo no encontrado en public/freddy-logo.png");
    }

    // 🧩 Lanzar Playwright
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Quote ${quote.id}</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #ffffff;
            color: #000000;
            font-size: 10pt;
          }
          .page {
            width: 612pt;
            height: 792pt;
            margin: 10pt auto;
            border: 1pt solid #000000;
            position: relative;
            padding: 24pt 32pt;
          }

          .row {
            display: flex;
            justify-content: space-between;
          }

          .hr-strong {
            border-top: 1.5pt solid #e3e3e3;
            margin: 4pt 0;
          }
          .hr-soft {
            border-top: 0.75pt solid #e3e3e3;
            margin: 4pt 0;
          }

          .top-company {
            margin-bottom: 6pt;
          }
          .top-company .name {
            font-size: 9.5pt;
            font-weight: bold;
          }
          .top-company .line {
            font-size: 9.5pt;
          }
          .logo-box {
            text-align: right;
          }
          .logo-box img {
            width: 112pt;
            height: auto;
          }

          .quote-header-band {
            background: #f6f6f6;
            margin-top: 4pt;
            margin-bottom: 4pt;
            padding: 10pt 12pt;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .quote-title {
            font-size: 21pt;
            font-weight: bold;
          }
          .quote-meta {
            font-size: 7.5pt;
            color: #6d6a6a;
            text-align: right;
          }
          .quote-meta .label {
            text-transform: uppercase;
            font-size: 7.5pt;
            color: #6d6a6a;
          }
          .quote-meta .value {
            font-size: 9pt;
            color: #000000;
            margin-bottom: 2pt;
          }

          .small-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            color: #6d6a6a;
          }
          .small-value {
            font-size: 9pt;
            color: #000000;
          }

          .section-top-mini {
            margin-top: 6pt;
            margin-bottom: 4pt;
          }

          table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6pt;
            margin-bottom: 8pt;
          }
          table.items th {
            font-size: 7.5pt;
            color: #999999;
            text-transform: uppercase;
            text-align: left;
            padding: 4pt 2pt;
            border-bottom: 0.75pt solid #e3e3e3;
          }
          table.items td {
            font-size: 9pt;
            padding: 4pt 2pt;
            border-bottom: 0.75pt solid #e3e3e3;
          }
          table.items th.qty,
          table.items td.qty {
            text-align: right;
            width: 50pt;
          }
          table.items th.up,
          table.items td.up {
            text-align: right;
            width: 70pt;
          }
          table.items th.total,
          table.items td.total {
            text-align: right;
            width: 80pt;
          }
          table.items th.idx,
          table.items td.idx {
            width: 18pt;
          }

          .notes-block {
            font-size: 6pt;
            color: #000000;
            margin-top: 6pt;
            max-width: 360pt;
          }
          .notes-block em {
            font-style: italic;
          }
          .notes-title {
            font-size: 6pt;
            font-weight: bold;
            margin-top: 4pt;
          }

          .totals-box-wrapper {
            position: absolute;
            right: 32pt;
            bottom: 106pt;
          }
          .totals-box {
            width: 187pt;
            background: #f6f6f6;
            border: 0.75pt solid #e3e3e3;
            padding: 10pt 10pt 12pt 10pt;
            font-size: 9pt;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4pt;
          }
          .totals-row.total {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 4pt;
          }

          .downpayment {
            font-size: 9pt;
            font-weight: bold;
            margin-top: 10pt;
          }

          .signature-row {
            position: absolute;
            left: 32pt;
            bottom: 90pt;
            right: 32pt;
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            font-weight: bold;
          }
          .signature-row .label {
            margin-right: 4pt;
          }
          .signature-row .line {
            flex: 1;
            border-bottom: 0.75pt solid #e3e3e3;
            margin: 0 8pt 2pt 4pt;
          }

          .footer {
            position: absolute;
            left: 32pt;
            right: 32pt;
            bottom: 16pt;
            font-size: 6pt;
            color: #000000;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="page">

          <!-- Top: Company info + Logo -->
          <div class="row top-company">
            <div>
              <div class="name">Freddy Graphics LLC</div>
              <div class="line">217 Ferry St, Suite 6 Newark, NJ 07105</div>
              <div class="line">info@freddygraphics.com</div>
              <div class="line">(862) 208-4041</div>
              <div class="line" style="margin-top:6pt;">freddygraphics.com</div>
            </div>
            <div class="logo-box">
              ${
                logoBase64
                  ? `<img src="data:image/png;base64,${logoBase64}" alt="Freddy Graphics Logo" />`
                  : ""
              }
            </div>
          </div>

          <div class="hr-strong"></div>

          <!-- Quote header band -->
          <div class="quote-header-band">
            <div class="quote-title">Quote ${quote.id}</div>
            <div class="quote-meta">
              <div>
                <div class="label">QUOTE DATE</div>
                <div class="value">${quoteDate}</div>
              </div>
              <div style="margin-top:4pt;">
                <div class="label">QUOTE EXPIRY DATE</div>
                <div class="value">${validUntil || ""}</div>
              </div>
              <div style="margin-top:4pt;">
                <div class="label">TERMS</div>
                <div class="value">Net 15</div>
              </div>
            </div>
          </div>

          <div class="hr-strong"></div>

          <!-- Requested by / Contact info -->
          <div class="section-top-mini row">
            <div style="width:45%;">
              <div class="small-label">REQUESTED BY</div>
              <div class="small-value">${
                quote.client?.name || quote.client?.company || ""
              }</div>
            </div>
            <div style="width:45%;">
              <div class="small-label">CONTACT INFO</div>
              <div class="small-value">${
                quote.client?.name || ""
              }</div>
              ${
                quote.client?.phone
                  ? `<div class="small-value">${quote.client.phone}</div>`
                  : ""
              }
              ${
                quote.client?.email
                  ? `<div class="small-value">${quote.client.email}</div>`
                  : ""
              }
            </div>
          </div>

          <div class="hr-soft"></div>

          <!-- Items Table -->
          <table class="items">
            <thead>
              <tr>
                <th class="idx">#</th>
                <th>ITEM</th>
                <th class="qty">QTY</th>
                <th class="up">U.PRICE</th>
                <th class="total">TOTAL (EXCL. TAX)</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length > 0
                  ? items
                      .map((item, i) => {
                        const qty = Number(item.qty || 0);
                        const up = Number(item.unitPrice || 0);
                        const rowTotal = Number(item.total || qty * up);
                        return `
                          <tr>
                            <td class="idx">${i + 1}</td>
                            <td><span style="font-weight:bold;">${item.name}</span>${
                          item.notes
                            ? `<div style="font-size:7.5pt; color:#555;">${item.notes}</div>`
                            : ""
                        }</td>
                            <td class="qty">${qty}</td>
                            <td class="up">$${up.toFixed(2)}</td>
                            <td class="total">$${rowTotal.toFixed(2)}</td>
                          </tr>
                        `;
                      })
                      .join("")
                  : `
                    <tr>
                      <td colspan="5" style="text-align:center; color:#999; padding:8pt 0;">
                        No items found for this quote.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>

          <!-- Notas / Terms largos -->
          <div class="notes-block">
            <em>This handcrafted quote is based on the specific information you've given us and is valid for 30 days.</em>
            <div style="margin-top:6pt;">
              When you approve this quote, you are agreeing to pay 100% of the quoted price.
              We require a 50% deposit to begin work on your project. Once we receive your deposit,
              we'll schedule your project and email you an estimated completion date. The remaining
              balance is due upon completion of your order.
            </div>
            <div style="margin-top:6pt;">
              <span class="notes-title">Need to make changes?</span><br />
              No problem – but please realize, changes to quantity or specifications will affect your price.
              We will provide you with an updated quote based on the changes.
            </div>
          </div>

          <!-- Totals box -->
          <div class="totals-box-wrapper">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>$${Number(quote.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row">
                <span>Sales Tax (6.625%):</span>
                <span>$${Number(quote.tax || 0).toFixed(2)}</span>
              </div>
              <div class="totals-row total">
                <span>Total:</span>
                <span>$${Number(quote.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Downpayment -->
          <div class="downpayment">
            Downpayment (50.0 %): $${deposit.toFixed(2)}
          </div>

          <!-- Signature / Date -->
          <div class="signature-row">
            <div style="display:flex; align-items:flex-end; width:60%;">
              <span class="label">SIGNATURE:</span>
              <span class="line"></span>
            </div>
            <div style="display:flex; align-items:flex-end; width:30%; justify-content:flex-end;">
              <span class="label">DATE:</span>
              <span class="line"></span>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>
              PRINTED ON ${new Date().toLocaleString()} BY FREDDY GRAPHICS
            </div>
            <div>1/1</div>
          </div>

        </div>
      </body>
      </html>
    `);

 const pdf = await page.pdf({
  format: "Letter",
  margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
  printBackground: true,
});


    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quote_${quote.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: error.message },
      { status: 500 }
    );
  }
}
