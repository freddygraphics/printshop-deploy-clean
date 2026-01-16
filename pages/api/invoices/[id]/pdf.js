import prisma from "@/lib/db";
import { buildInvoiceHtml } from "@/lib/invoice/buildInvoiceHtml";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const id = Number(req.query.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid invoice id" });
    }

    // -----------------------------
    // FETCH INVOICE
    // -----------------------------
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        payments: true,
        invoiceItems: true,
        appliedDiscounts: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // -----------------------------
    // ITEMS
    // -----------------------------
    const items = invoice.invoiceItems.map((i) => ({
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: i.total,
      description: "",
    }));

    const subtotal = items.reduce((s, i) => s + i.total, 0);

    // -----------------------------
    // DISCOUNT
    // -----------------------------
    let discountAmount = 0;
    let discountLabel = "";

    const discount = invoice.appliedDiscounts?.[0];

    if (discount) {
      discountLabel = discount.name;

      discountAmount =
        discount.type === "percent"
          ? subtotal * (discount.value / 100)
          : discount.value;

      discountAmount = Math.min(discountAmount, subtotal);
    }

    const discountedSubtotal = subtotal - discountAmount;

    // -----------------------------
    // TAX
    // -----------------------------
    const tax =
      invoice.taxEnabled && invoice.taxRate
        ? discountedSubtotal * (invoice.taxRate / 100)
        : 0;

    const total = discountedSubtotal + tax;

    // -----------------------------
    // PAYMENTS
    // -----------------------------
    const payments = invoice.payments || [];
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const balance = total - totalPaid;

    // -----------------------------
    // DATES
    // -----------------------------
    const issuedAt = invoice.issuedAt
      ? new Date(invoice.issuedAt).toLocaleDateString()
      : "";

    const dueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString()
      : "—";

    // -----------------------------
    // BUILD HTML
    // -----------------------------
    const html = buildInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issuedAt,
      dueDate,
      client: invoice.client,
      items,
      subtotal,
      discountAmount,
      discountLabel,
      tax,
      total,
      payments,
      balance,
    });

    // -----------------------------
    // GENERATE PDF
    // -----------------------------
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: {
        top: "5px",
        bottom: "5px",
        left: "5px",
        right: "5px",
      },
    });

    await browser.close();

    // -----------------------------
    // RESPONSE (CLAVE)
    // -----------------------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${invoice.invoiceNumber}.pdf`
    );

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("❌ PDF ERROR:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
}
