import { put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { prisma } from "@/lib/db";

export async function POST(req, { params }) {
  const id = params.id;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { pdfStatus: true, updatedAt: true, pdfUpdatedAt: true },
    });

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
      where: { id },
      data: { pdfStatus: "generating" },
    });

    const htmlUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/invoices/${id}/html`;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(htmlUrl, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    await put(`invoices/${id}.pdf`, pdf, {
      access: "public",
      contentType: "application/pdf",
    });

    await prisma.invoice.update({
      where: { id },
      data: {
        pdfStatus: "ready",
        pdfUpdatedAt: new Date(),
      },
    });

    return new Response("OK");
  } catch (err) {
    console.error(err);

    await prisma.invoice.update({
      where: { id },
      data: { pdfStatus: "error" },
    });

    return new Response("Error", { status: 500 });
  }
}
