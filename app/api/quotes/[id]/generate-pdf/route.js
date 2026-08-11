import { put } from "@vercel/blob";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const { id } = await params;
  const quoteId = Number(id);

  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    return new Response("Invalid quote id", {
      status: 400,
    });
  }

  let browser = null;

  try {
    const quote = await prisma.quote.findUnique({
      where: {
        id: quoteId,
      },
      select: {
        pdfStatus: true,
        updatedAt: true,
        pdfUpdatedAt: true,
      },
    });

    if (!quote) {
      return new Response("Quote not found", {
        status: 404,
      });
    }

    if (quote.pdfStatus === "generating") {
      return Response.json(
        {
          ok: false,
          generating: true,
        },
        {
          status: 409,
        },
      );
    }

    const force = new URL(req.url).searchParams.get("force") === "1";

    if (!force && quote.pdfUpdatedAt && quote.updatedAt <= quote.pdfUpdatedAt) {
      return Response.json({
        ok: true,
        upToDate: true,
      });
    }

    await prisma.quote.update({
      where: {
        id: quoteId,
      },
      data: {
        pdfStatus: "generating",
      },
    });

    const htmlUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/quotes/${quoteId}/html`;

    const isLocal = process.env.NODE_ENV === "development";

    const executablePath = isLocal
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : await chromium.executablePath();

    browser = await puppeteer.launch({
      args: isLocal
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : chromium.args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(htmlUrl, {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(async () => {
      await document.fonts.ready;

      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );
    });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    });

    const version = Date.now();

    const blob = await put(`quotes/${quoteId}-${version}.pdf`, pdf, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
    });

    await prisma.quote.update({
      where: {
        id: quoteId,
      },
      data: {
        pdfStatus: "ready",
        pdfUpdatedAt: new Date(),
      },
    });

    return Response.json({
      ok: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("❌ Quote PDF generation error:", error);

    try {
      await prisma.quote.update({
        where: {
          id: quoteId,
        },
        data: {
          pdfStatus: "error",
        },
      });
    } catch {}

    return new Response("Error", {
      status: 500,
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
