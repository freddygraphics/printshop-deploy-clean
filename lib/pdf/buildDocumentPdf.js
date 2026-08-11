import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

// ======================================================
// HELPERS
// ======================================================
function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return safeNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("en-US");
  } catch {
    return String(value);
  }
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

// ======================================================
// PDF BUILDER
// ======================================================
export async function buildDocumentPdf({
  documentType = "invoice",

  documentNumber,

  issuedAt,
  dueDate,
  status,

  client,

  items = [],

  subtotal = 0,
  tax = 0,
  total = 0,

  discountAmount = 0,
  discountLabel = null,

  payments = [],
  balance = 0,

  logoBytes = null,
}) {
  const pdfDoc = await PDFDocument.create();

  // ======================================================
  // PAGE
  // Letter 8.5 x 11
  // ======================================================
  const page = pdfDoc.addPage([612, 792]);

  const { width, height } = page.getSize();

  // ======================================================
  // FONTS
  // ======================================================
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ======================================================
  // COLORS
  // ======================================================
  const black = rgb(0.07, 0.07, 0.07);

  const gray = rgb(0.38, 0.38, 0.38);

  const lightGray = rgb(0.94, 0.94, 0.94);

  const panelGray = rgb(0.97, 0.97, 0.97);

  // ======================================================
  // DOCUMENT SETTINGS
  // ======================================================
  const isQuote = documentType === "quote";

  const documentTitle = isQuote ? "Quote" : "Invoice";

  const documentDateLabel = isQuote ? "Quote Date:" : "Invoice Date:";

  const secondDateLabel = isQuote ? "Valid Until:" : "Due Date:";

  const margin = 36;

  const contentWidth = width - margin * 2;

  let y = height - margin;
  // ======================================================
  // PAID WATERMARK
  // ======================================================
  const paymentsTotal = Array.isArray(payments)
    ? payments.reduce((sum, payment) => sum + safeNumber(payment?.amount), 0)
    : 0;

  const invoiceTotalForWatermark = safeNumber(total);

  const balanceForWatermark =
    balance !== null && balance !== undefined
      ? safeNumber(balance)
      : invoiceTotalForWatermark - paymentsTotal;

  const isPaid =
    !isQuote &&
    (String(status || "")
      .trim()
      .toLowerCase() === "paid" ||
      (invoiceTotalForWatermark > 0 && balanceForWatermark <= 0.01));

  if (isPaid) {
    const watermarkText = "PAID";
    const watermarkSize = 105;

    const textWidth = bold.widthOfTextAtSize(watermarkText, watermarkSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2 - 20,
      y: height / 2 - 40,

      size: watermarkSize,
      font: bold,

      color: rgb(0.82, 0.82, 0.82),
      opacity: 0.1,

      rotate: degrees(35),
    });
  }
  // ======================================================
  // HEADER — COMPANY
  // ======================================================
  const companyX = margin;

  page.drawText("Freddy Graphics LLC", {
    x: companyX,
    y: y - 22,
    size: 12,
    font: bold,
    color: black,
  });

  page.drawText("217 Ferry St, Suite 5 Newark, NJ 07105", {
    x: companyX,
    y: y - 37,
    size: 10,
    font: regular,
    color: black,
  });

  page.drawText("info@freddygraphics.com", {
    x: companyX,
    y: y - 51,
    size: 10,
    font: regular,
    color: black,
  });

  page.drawText("(862) 208-4041", {
    x: companyX,
    y: y - 65,
    size: 10,
    font: regular,
    color: black,
  });

  page.drawText("freddygraphics.com", {
    x: companyX,
    y: y - 89,
    size: 10,
    font: bold,
    color: black,
  });

  // ======================================================
  // LOGO
  // ======================================================
  if (logoBytes) {
    try {
      let logo;

      try {
        logo = await pdfDoc.embedPng(logoBytes);
      } catch {
        logo = await pdfDoc.embedJpg(logoBytes);
      }

      const originalSize = logo.scale(1);

      const maxWidth = 150;
      const maxHeight = 120;

      const ratio = Math.min(
        maxWidth / originalSize.width,
        maxHeight / originalSize.height,
      );

      const logoWidth = originalSize.width * ratio;

      const logoHeight = originalSize.height * ratio;

      page.drawImage(logo, {
        x: width - margin - logoWidth,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (error) {
      console.error("Could not embed PDF logo:", error);
    }
  }

  // ======================================================
  // DIVIDER
  // ======================================================
  y -= 105;

  page.drawLine({
    start: {
      x: margin,
      y,
    },
    end: {
      x: width - margin,
      y,
    },
    thickness: 1,
    color: lightGray,
  });

  // ======================================================
  // META PANEL
  // ======================================================
  const metaHeight = 64;

  page.drawRectangle({
    x: margin,
    y: y - metaHeight,
    width: contentWidth,
    height: metaHeight,
    color: panelGray,
  });
  // Línea superior
  page.drawLine({
    start: {
      x: margin,
      y: y,
    },
    end: {
      x: width - margin,
      y: y,
    },
    thickness: 1,
    color: lightGray,
  });

  // Línea inferior
  page.drawLine({
    start: {
      x: margin,
      y: y - metaHeight,
    },
    end: {
      x: width - margin,
      y: y - metaHeight,
    },
    thickness: 1,
    color: lightGray,
  });

  page.drawText(`${documentTitle} #${documentNumber ?? ""}`, {
    x: margin + 8,
    y: y - 30,
    size: 20,
    font: regular,
    color: black,
  });

  page.drawText(cleanText(status || ""), {
    x: margin + 280,
    y: y - 24,
    size: 9,
    font: regular,
    color: black,
  });

  const dateX = width - margin - 115;

  page.drawText(documentDateLabel, {
    x: dateX,
    y: y - 18,
    size: 8,
    font: regular,
    color: gray,
  });

  page.drawText(formatDate(issuedAt), {
    x: dateX,
    y: y - 29,
    size: 9,
    font: regular,
    color: black,
  });

  page.drawText(secondDateLabel, {
    x: dateX,
    y: y - 43,
    size: 8,
    font: regular,
    color: gray,
  });

  page.drawText(formatDate(dueDate), {
    x: dateX,
    y: y - 54,
    size: 9,
    font: regular,
    color: black,
  });

  y -= metaHeight;

  // ======================================================
  // CUSTOMER INFO
  // ======================================================
  y -= 20;

  const customerCol2 = margin + contentWidth / 2 + 20;

  page.drawText("COMPANY NAME", {
    x: margin,
    y,
    size: 7,
    font: regular,
    color: gray,
  });

  page.drawText(cleanText(client?.company || ""), {
    x: margin,
    y: y - 14,
    size: 10,
    font: bold,
    color: black,
  });

  page.drawText("CUSTOMER", {
    x: customerCol2,
    y,
    size: 7,
    font: regular,
    color: gray,
  });

  page.drawText(cleanText(client?.name || ""), {
    x: customerCol2,
    y: y - 14,
    size: 10,
    font: bold,
    color: black,
  });

  y -= 33;

  page.drawLine({
    start: {
      x: margin,
      y,
    },
    end: {
      x: width - margin,
      y,
    },
    thickness: 1,
    color: lightGray,
  });

  // ======================================================
  // TABLE HEADER
  // ======================================================
  y -= 18;

  const itemX = margin + 5;

  const qtyX = width - margin - 190;

  const unitX = width - margin - 105;

  const totalX = width - margin;

  page.drawText("Item", {
    x: itemX,
    y,
    size: 9,
    font: bold,
    color: black,
  });

  page.drawText("Qty", {
    x: qtyX,
    y,
    size: 9,
    font: bold,
    color: black,
  });

  page.drawText("Unit Price", {
    x: unitX - 25,
    y,
    size: 9,
    font: bold,
    color: black,
  });

  page.drawText("Total", {
    x: totalX - 28,
    y,
    size: 9,
    font: bold,
    color: black,
  });

  y -= 10;

  page.drawLine({
    start: {
      x: margin,
      y,
    },
    end: {
      x: width - margin,
      y,
    },
    thickness: 1,
    color: lightGray,
  });

  y -= 17;

  // ======================================================
  // ITEMS
  // ======================================================
  const safeItems = Array.isArray(items) ? items : [];

  const itemsSubtotal = safeItems.reduce(
    (sum, item) => sum + safeNumber(item?.total),
    0,
  );

  for (const item of safeItems) {
    // Evitar salir de la hoja
    if (y < 150) {
      break;
    }

    const itemName = cleanText(item?.name || item?.description || "Item");

    const description = cleanText(item?.description || "");

    page.drawText(itemName.slice(0, 60), {
      x: itemX,
      y,
      size: 8.5,
      font: bold,
      color: black,
    });

    if (description && description !== itemName) {
      page.drawText(description.slice(0, 80), {
        x: itemX,
        y: y - 11,
        size: 7.5,
        font: regular,
        color: gray,
      });
    }

    page.drawText(String(safeNumber(item?.qty)), {
      x: qtyX,
      y,
      size: 8.5,
      font: regular,
      color: black,
    });

    const unitPriceText = `$${formatMoney(item?.unitPrice)}`;

    const unitWidth = regular.widthOfTextAtSize(unitPriceText, 8.5);

    page.drawText(unitPriceText, {
      x: unitX - unitWidth,
      y,
      size: 8.5,
      font: regular,
      color: black,
    });

    const totalText = `$${formatMoney(item?.total)}`;

    const totalWidth = bold.widthOfTextAtSize(totalText, 8.5);

    page.drawText(totalText, {
      x: totalX - totalWidth,
      y,
      size: 8.5,
      font: bold,
      color: black,
    });

    y -= description && description !== itemName ? 26 : 17;
  }
  // ======================================================
  // PAYMENTS HISTORY
  // ======================================================
  if (!isQuote && Array.isArray(payments) && payments.length > 0) {
    y -= 20;

    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: lightGray,
    });

    y -= 18;

    page.drawText("Payments History", {
      x: margin,
      y,
      size: 9,
      font: bold,
      color: black,
    });

    y -= 18;

    for (const payment of payments) {
      if (y < 150) break;

      const dateText = payment?.paidAt
        ? new Date(payment.paidAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "—";

      // DATE
      page.drawText(dateText, {
        x: margin + 5,
        y,
        size: 8,
        font: regular,
        color: black,
      });

      // PAYMENT METHOD
      const methodText = cleanText(payment?.method || "Payment");

      page.drawText(methodText, {
        x: margin + 270,
        y,
        size: 8,
        font: regular,
        color: black,
      });

      // PAYMENT AMOUNT
      const amountText = `-$${formatMoney(payment?.amount)}`;

      const amountWidth = regular.widthOfTextAtSize(amountText, 8);

      page.drawText(amountText, {
        x: width - margin - amountWidth,
        y,
        size: 8,
        font: regular,
        color: black,
      });

      y -= 18;
    }

    y -= 18;
  }
  // ======================================================
  // TOTALS
  // ======================================================
  const safeSubtotal =
    safeNumber(subtotal) > 0 ? safeNumber(subtotal) : itemsSubtotal;

  const safeDiscount = safeNumber(discountAmount);

  const safeTax = safeNumber(tax);

  const safeTotal =
    safeNumber(total) > 0
      ? safeNumber(total)
      : Math.max(safeSubtotal - safeDiscount, 0) + safeTax;

  const totalPaid = Array.isArray(payments)
    ? payments.reduce((sum, payment) => sum + safeNumber(payment?.amount), 0)
    : 0;

  const safeBalance =
    balance !== null && balance !== undefined
      ? safeNumber(balance)
      : Math.max(safeTotal - totalPaid, 0);

  y -= 20;

  page.drawLine({
    start: {
      x: margin,
      y,
    },
    end: {
      x: width - margin,
      y,
    },
    thickness: 1,
    color: lightGray,
  });

  const totalsWidth = 220;
  const totalsHeight = !isQuote && payments?.length > 0 ? 100 : 75;

  const totalsX = width - margin - totalsWidth;

  const totalsY = y - totalsHeight - 12;

  page.drawRectangle({
    x: totalsX,
    y: totalsY,
    width: totalsWidth,
    height: totalsHeight,
    color: panelGray,
  });

  let ty = totalsY + totalsHeight - 18;

  function drawTotalRow(label, value, { font = regular, size = 8.5 } = {}) {
    page.drawText(label, {
      x: totalsX + 10,
      y: ty,
      size,
      font,
      color: black,
    });

    const valueText = `$${formatMoney(value)}`;

    const valueWidth = font.widthOfTextAtSize(valueText, size);

    page.drawText(valueText, {
      x: totalsX + totalsWidth - 10 - valueWidth,
      y: ty,
      size,
      font,
      color: black,
    });

    ty -= 15;
  }

  drawTotalRow("Subtotal", safeSubtotal);

  if (safeDiscount > 0) {
    drawTotalRow(
      discountLabel ? `Discount (${discountLabel})` : "Discount",
      -safeDiscount,
    );
  }

  drawTotalRow("Sales Tax", safeTax);

  drawTotalRow("Total", safeTotal, {
    font: bold,
    size: 11,
  });

  if (!isQuote && Array.isArray(payments) && payments.length > 0) {
    drawTotalRow("Balance Due", safeBalance, {
      font: bold,
    });
  }

  // ======================================================
  // METADATA
  // ======================================================
  pdfDoc.setTitle(`${documentTitle} ${documentNumber ?? ""}`);

  pdfDoc.setAuthor("Freddy Graphics LLC");

  pdfDoc.setCreator("Freddy Graphics");

  pdfDoc.setProducer("Freddy Graphics");

  // ======================================================
  // SAVE
  // ======================================================

  return await pdfDoc.save();
}
