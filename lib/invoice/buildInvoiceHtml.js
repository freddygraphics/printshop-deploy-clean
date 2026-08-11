export function buildInvoiceHtml({
  documentType = "invoice",
  invoiceId,
  invoiceNumber,
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
}) {
  // ============================
  // ITEMS
  // ============================
  const isQuote = documentType === "quote";

  const documentTitle = isQuote ? "Quote" : "Invoice";
  const documentPrefix = isQuote ? "QUOTE" : "INV";

  const documentDateLabel = isQuote ? "Quote Date:" : "Invoice Date:";
  const secondDateLabel = isQuote ? "Valid Until:" : "Due Date:";

  // ============================
  // SAFE NUMBERS
  // ============================
  const safeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // ============================
  // MONEY FORMAT
  // ============================
  const formatMoney = (value) => {
    return safeNumber(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  };

  // ============================
  // ITEMS
  // ============================
  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td>
        <strong>${item.name}</strong><br/>
        <span style="font-size:11px;color:#555;">
          ${item.description || ""}
        </span>
      </td>

      <td class="right">
        ${Number(item.qty || 0)}
      </td>

      <td class="right">
        $${formatMoney(item.unitPrice)}
      </td>

      <td class="right">
        <strong>$${formatMoney(item.total)}</strong>
      </td>
    </tr>
  `,
    )
    .join("");
  // ============================
  // ITEMS SUBTOTAL
  // ============================
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + safeNumber(item.total),
    0,
  );

  const safeSubtotal =
    safeNumber(subtotal) > 0 ? safeNumber(subtotal) : itemsSubtotal;

  const safeDiscount = safeNumber(discountAmount);
  const discountedSubtotal = Math.max(safeSubtotal - safeDiscount, 0);
  const safeTax = safeNumber(tax);

  const safeTotal =
    safeNumber(total) > 0 ? safeNumber(total) : discountedSubtotal + safeTax;

  // ============================
  // PAYMENTS (ORDER IS CRITICAL)
  // ============================

  // Total pagado
  const totalPaid = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);

  // Processing fee total
  const totalProcessingFee = payments.reduce(
    (sum, p) => sum + safeNumber(p.processingFee),
    0,
  );

  // Flags base
  const hasPayments =
    !isQuote && Array.isArray(payments) && payments.length > 0;

  // Balance
  const safeBalance =
    safeNumber(balance) !== 0 ? safeNumber(balance) : safeTotal - totalPaid;

  const showBalanceDue = hasPayments;

  // Métodos de pago
  const paymentMethods = hasPayments
    ? payments.map((p) => (p.method || "").toLowerCase())
    : [];

  const uniqueMethods = [...new Set(paymentMethods)];

  const formatMethod = (m) => {
    if (m === "cash") return "Cash";
    if (m === "card") return "Card";
    if (m === "zelle") return "Zelle";
    return "Payment";
  };

  // Label de pago
  let paymentLabel = "Payment";

  if (uniqueMethods.length === 1) {
    paymentLabel = `${formatMethod(uniqueMethods[0])} Payment`;
  } else if (uniqueMethods.length > 1) {
    paymentLabel = "Payments Received (Mixed)";
  }

  // 💳 Detección de tarjeta:
  // Si hay processing fee, NO mostramos "Card Payment"
  const isCardPayment = hasPayments && totalProcessingFee > 0;

  // Total cobrado (solo informativo)
  const totalCharged = safeTotal + totalProcessingFee;
  // ============================
  // DATES
  // ============================
  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-US");
    } catch {
      return String(d);
    }
  };

  const issuedAtText = fmtDate(issuedAt);
  const dueDateText = dueDate ? fmtDate(dueDate) : "—";

  // ============================
  // PAYMENTS HISTORY (DETAIL)
  // ============================

  const formatPaymentMethod = (m) => {
    const method = String(m || "").toLowerCase();

    if (method === "card") return "Card Payment";
    if (method === "cash") return "Cash Payment";
    if (method === "zelle") return "Zelle Payment";

    return "Payment";
  };

  const showPaymentsHistory = !isQuote && hasPayments && totalPaid > 0;

  const paymentsHistoryRows = showPaymentsHistory
    ? payments
        .map((p) => {
          const date = p.createdAt
            ? new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })
            : "—";

          const fee = safeNumber(p.processingFee);
          const totalCharged = safeNumber(p.amount) + fee;

          const paymentLabel =
            String(p.method).toLowerCase() === "card"
              ? `Card Payment (+$${formatMoney(fee)} Fee)`
              : formatPaymentMethod(p.method);

          return `
<tr>
  <td>${date}</td>
  <td>${paymentLabel}</td>
<td class="right">−$${formatMoney(totalCharged)}</td>
</tr>
`;
        })
        .join("")
    : "";

  // ============================
  // HTML
  // ============================
  return `
<!DOCTYPE html>
<html>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>

<meta charset="UTF-8" />
<style>


 body {


    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    color: #111;
    margin: 0;
  padding: 0;
  background: white;
  
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    
  }

  .company-info {
    font-size: 16px;
    line-height: 1.2;
     margin-top: 40px; 
  }
     .company-website {
  margin-top: 14px; /* 👈 lo baja */
  font-weight: 500;
  color: #111;
}

  .logo {
    width: 250px;
  }

  hr {
    border: none;
    border-top: 2px solid #e5e5e5;
    margin: 2px 0;
  }

  .invoice-meta {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 20px;
    font-size: 12px;
     background-color: #F7F7F7;
     padding: 10px ;
 
  }
  
  .invoice-meta .invoice-title{
    font-size: 28px;
  
  
  }
  
.invoice-meta .invoice-date,
.invoice-meta .invoice-due,
 {
  font-size: 12px;
}
  .info {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 👈 izquierda / derecha */
  gap: 40px;
  padding-bottom: 12px;
  margin-top: 15px;
  border-bottom: 2px solid #f3f3f3;
}



/* TITULOS */
.info-title {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
  margin-bottom: 4px;
}

/* VALORES */
.info-company {
  font-size: 14px;
  font-weight: 500; /* 👈 medium NO es válido */
  color: #111;
}

  .invoice-title {
    font-size: 28px;
    font-weight:medium ;
  }

  .section {
    margin-top: 20px;
  }

 table {
  width: 100%;
  border-collapse: collapse;
}

.items tr {
  font-size: 11px;
}

  
th {
  text-align: left;
  font-weight: 600;
  padding: 10px 8px;
  border-bottom: 2px solid #f3f3f3;
  font-size: 12px;
}

/* Item más ancho */
th:first-child,
td:first-child {
  width: 50%;
}

/* Cantidad */
.center {
  text-align: center;
  width: 80px;
}

/* Precios a la derecha */
.right {
  text-align: right;
  width: 120px;
}

/* Filas */
td {
  padding: 4px 8px;

  vertical-align: top;
}

/* Descripción secundaria */


  
  .items {
  font-size: 10px;
  
}
  
.invoice-divider {
  width: 100%;
  height: 2px;
  background-color: #e11d48; /* rojo */
  margin: 40px 0 30px;
}

  .center { text-align: center; }
  .right { text-align: right; }


.invoice-page {
  width: 100%;
  height: auto;
  background: white;
  box-sizing: border-box;
    max-width: 7.5in; /* 8.5 - márgenes */
  margin: 0 auto;

  min-height: calc(11in - 1in); /* altura Letter menos márgenes */
}

@media print {
 #actions {
    display: none !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
    

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff; /* opcional */
}
.footer {
  margin-top: 40px;
}

  .totals {
    page-break-inside: avoid;
  }

  
  
.invoice-bottom-line,
.invoice-bottom-line-bottom {
  width: 100%;
  border-top: 2px solid #f3f3f3;  /* 👈 esto es CLAVE */
  margin: 20px 0;
}



@page {
  size: Letter;
  margin:0.5in;
}

.totals {
  width: 300px;
  font-size: 11px;
  background-color: #f5f6f8;
  padding: 15px;
 
}

.totals table td {
  padding: 3px 0;
   
}
.totals table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;      /* 🔥 */
  padding: 0;     /* 🔥 */
  
}

.totals .right {
  text-align: right;
}

.totals .grand-total td {
  font-size: 15px;
  font-weight: bold;
}
.footer {
  margin-top: 40px;
}

/* Descuentos */
.discount td {
  color: #000000; /* verde */
  font-size: 12px;
    left: 0;       /* 👈 CAMBIA ESTO */
  width: 100%; 
}

/* Pagos */
.payment td {
  color: #000000; /* azul */
  font-size: 12px;
}

/* Balance */
.balance td {
  font-size: 13px;
  font-weight: bold;
  color: #000000;
  border-top: 2px solid #e5e7eb;
  padding-top: 8px;
}
.watermark {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 120px;
  font-weight: 600;
  color: rgba(80, 80, 80, 0.03); /* verde suave */
  z-index: 0;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}
.footer-inner {
  max-width: 700px;   /* mismo ancho que invoice-page */
  margin: 0 auto;
}

.totals {
  margin-left: auto;  /* lo manda a la derecha */
}
</style>
</head>

<body>
<div id="actions" style="position:fixed; top:10px; right:20px; z-index:9999;">
  <button onclick="window.print()">🖨️ Print</button>
  <button onclick="downloadPDF()">⬇️ Download</button>
</div>
 <div class="invoice-page">
${!isQuote && safeBalance <= 0 ? `<div class="watermark">PAID</div>` : ""}

  <!-- HEADER -->
  <div class="header">
    <div class="company-info">
      <strong>Freddy Graphics LLC</strong><br/>
      217 Ferry St, Suite 5 Newark, NJ 07105<br/>
      info@freddygraphics.com<br/>
      (862) 208-4041
      <div class="company-website">freddygraphics.com </div>
    </div>

<img
  src="https://app.freddygraphics.com/logo.png"
  alt="Freddy Graphics Logo"
  style="height:130px"
/>


  </div>

  <hr/>

  <!-- INVOICE META -->
  <div class="invoice-meta ">
    <div>
    <div class="invoice-title">${documentTitle} #${invoiceNumber}</div>
    </div>

    <div>
      <div class="invoice-status"> ${status}</div>
  
    </div>

    <div>
   <div class="invoice-date">${documentDateLabel}</div>
${issuedAtText}<p>
<div class="invoice-due">${secondDateLabel}</div>
${dueDateText}
    </div>
  </div>

  <hr/>
 <div class="info">
  <!-- CUSTOMER -->
    <div class="info-block">
    <div class="info-title">Company name</div>
    <div class="info-company">${client.company || ""}</div>
  </div>

  <div class="info-block">
    <div class="info-title">Customer</div>
    <div class="info-company">${client.name}</div>
  </div>
</div>

  <!-- ITEMS -->
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
   <tbody class="items">
  ${itemsRows}
</tbody>

  </table>
<!-- PAYMENTS HISTORY -->
${
  showPaymentsHistory
    ? `
<div style="margin-top:30px;">
  <div style="border-top:2px solid #e5e5e5; margin-bottom:10px;"></div>
  <div style="font-weight:600; font-size:12px; margin-bottom:6px;">
    Payments History
  </div>

  <table style="width:100%; font-size:12px; border-collapse:collapse;">
    <tbody>
      ${paymentsHistoryRows}
    </tbody>
  </table>
</div>
`
    : ""
}


  <!-- TOTALS -->
 

   <!-- FOOTER (SIEMPRE AL FINAL) -->
  <div class="footer">

 <div class="invoice-bottom-line"></div>
   <div class="footer-inner">
    <div class="totals">
       
  
  <table>

<!-- SUBTOTAL -->
<tr>
  <td>Subtotal</td>
  <td class="right">$${formatMoney(safeSubtotal)}</td>
</tr>

<!-- DESCUENTO -->
${
  discountAmount > 0
    ? `
<tr class="discount">
  <td>Discount${discountLabel ? ` (${discountLabel})` : ""}</td>
<td class="right">−$${formatMoney(safeDiscount)}</td>
</tr>
`
    : ""
}

<!-- TAX -->
<tr>
  <td>Sales Tax</td>
<td class="right">$${formatMoney(safeTax)}</td>
</tr>

<!-- TOTAL -->
<tr class="grand-total">
  <td>Total</td>
<td class="right">$${formatMoney(safeTotal)}</td>
</tr>

<!-- PAYMENTS -->
<!-- PROCESSING FEE (SOLO CARD) -->
${
  totalProcessingFee > 0
    ? `
<tr class="payment">
  <td>Processing Fee</td>
  <td class="right">+$${formatMoney(totalProcessingFee)}</td>
</tr>

<tr class="payment">
  <td><strong>Total Charged</strong></td>
  <td class="right"><strong>$${formatMoney(totalCharged)}</strong></td>
</tr>
`
    : ""
}

<!-- BALANCE -->
${
  showBalanceDue
    ? `
<tr class="balance">
  <td>Balance Due</td>
  <td class="right">$${formatMoney(safeBalance)}</td>
</tr>
`
    : ""
}







</table>
    </div>
</div>
<div class="invoice-bottom-line-bottom"></div>

    </div>

  </div>


</div> <!-- 👈 CIERRA invoice-page -->

<script>
function downloadPDF() {
  const isQuote = ${isQuote};

  const a = document.createElement("a");

  a.href = isQuote
    ? "/api/quotes/${invoiceId}/pdf"
    : "/api/invoices/${invoiceId}/pdf";

  a.download = "${documentPrefix}_${invoiceNumber}.pdf";

  document.body.appendChild(a);
  a.click();
  a.remove();
}
</script>


</body>
</html>
`;
}
