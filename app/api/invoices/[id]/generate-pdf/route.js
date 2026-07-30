import { put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import prisma from "@/lib/db";

export async function POST(req, { params }) {
  const invoiceId = Number(params.id);

  if (Number.isNaN(invoiceId)) {
    return new Response("Invalid invoice id", {
      status: 400,
    });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      select: {
        pdfStatus: true,
        updatedAt: true,
        pdfUpdatedAt: true,
      },
    });
    if (!invoice) {
      return new Response("Invoice not found", {
        status: 404,
      });
    }
    // 🧠 SI YA ESTÁ GENERANDO → NO DUPLICAR
    if (invoice.pdfStatus === "generating") {
      return new Response("Already generating");
    }

    // 🧠 SI NO HAY CAMBIOS → NO REGENERAR
    if (invoice.pdfUpdatedAt && invoice.updatedAt <= invoice.pdfUpdatedAt) {
      return new Response("PDF up to date");
    }

    // 🔥 marcar como generando
    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: { pdfStatus: "generating" },
    });

    const htmlUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/invoices/${invoiceId}/html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();
    await put(`invoices/${invoiceId}.pdf`, pdf, {
      access: "public",
      contentType: "application/pdf",
    });

    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        pdfStatus: "ready",
        pdfUpdatedAt: new Date(),
      },
    });

    return new Response("OK");
  } catch (err) {
    console.error(err);

    await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: { pdfStatus: "error" },
    });

    return new Response("Error", { status: 500 });
  }
}
