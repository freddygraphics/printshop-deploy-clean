export function buildInvoiceHtml({
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
        <td class="right">${Number(item.qty || 0)}</td>
        <td class="right">$${Number(item.unitPrice || 0).toFixed(2)}</td>
        <td class="right"><strong>$${Number(item.total || 0).toFixed(2)}</strong></td>
      </tr>
    `,
    )
    .join("");

  // ============================
  // SAFE NUMBERS
  // ============================
  const safeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const itemsSubtotal = items.reduce(
    (sum, it) => sum + safeNumber(it.total),
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
  // PAYMENTS
  // ============================
  const totalPaid = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);

  const totalProcessingFee = payments.reduce(
    (sum, p) => sum + safeNumber(p.processingFee),
    0,
  );

  // 👉 EL CLIENTE PAGA: TOTAL + FEE
  const totalCharged = safeTotal + totalProcessingFee;

  const safeBalance =
    safeNumber(balance) !== 0 ? safeNumber(balance) : safeTotal - totalPaid;

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
  border-bottom: 2px solid #e5e5e5;
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
  font-size: 12px;
}

  
th {
  text-align: left;
  font-weight: 600;
  padding: 10px 8px;
  border-bottom: 2px solid #e5e7eb;
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
  padding: 5px 8px;

  vertical-align: top;
}

/* Descripción secundaria */


  
  .items {
  font-size: 12px;
  
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
  position: relative;
  width: 816px;
  min-height: 1056px; /* NO height fijo */
  padding: 20px;
  box-sizing: border-box;
  z-index: 1;
}


  
  
  
.invoice-bottom-line {
  position: absolute;
  top: -12px;          /* 🔼 se pega arriba del total */
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e5e5e5;
}

.invoice-bottom-line-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;      /* 👈 pegada debajo del bloque */
  height: 2px;
  background-color: #e5e5e5;
}





.totals {
  width: 300px;
  font-size: 12px;
  background-color: #f5f6f8;
  padding: 15px;
}

.totals table td {
  padding: 6px 0;
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
  font-size: 18px;
  font-weight: bold;
}
.footer {
  position: absolute;
  bottom: 65px;   /* ⬅️ sube un poco */
  left: 40px;
  right: 40px;
  display: flex;
  justify-content: flex-end;
   background: transparent; /* 🔥 importante */
}

/* Descuentos */
.discount td {
  color: #000000; /* verde */
  font-size: 12px;
}

/* Pagos */
.payment td {
  color: #000000; /* azul */
  font-size: 12px;
}

/* Balance */
.balance td {
  font-size: 16px;
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

</style>
</head>

<body>
 <div class="invoice-page">
${safeBalance <= 0 ? `<div class="watermark">PAID</div>` : ""}

  <!-- HEADER -->
  <div class="header">
    <div class="company-info">
      <strong>Freddy Graphics LLC</strong><br/>
      217 Ferry St, Suite 5 Newark, NJ 07105<br/>
      info@freddygraphics.com<br/>
      (862) 208-4041
      <div class="company-website">freddygraphics.com </div>
    </div>

<img src="https://app.freddygraphics.com/logo.png" class="logo" />

  </div>

  <hr/>

  <!-- INVOICE META -->
  <div class="invoice-meta ">
    <div>
      <div class="invoice-title">Invoice #${invoiceNumber}</div>
    </div>

    <div>
      <div class="invoice-status"> ${status}</div>
  
    </div>

    <div>
     <div class="invoice-date">Invoice Date:</div>
   ${issuedAtText}<p>
      <div class="invoice-due">Due Date:</div>
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


  <!-- TOTALS -->
 

   <!-- FOOTER (SIEMPRE AL FINAL) -->
  <div class="footer">


    <div class="totals">
        <div class="invoice-bottom-line"></div>
  
  <table>

<!-- SUBTOTAL -->
<tr>
  <td>Subtotal</td>
  <td class="right">$${safeSubtotal.toFixed(2)}</td>
</tr>

<!-- DESCUENTO -->
${
  discountAmount > 0
    ? `
<tr class="discount">
  <td>Discount${discountLabel ? ` (${discountLabel})` : ""}</td>
  <td class="right">−$${safeDiscount.toFixed(2)}</td>
</tr>
`
    : ""
}

<!-- TAX -->
<tr>
  <td>Sales Tax</td>
  <td class="right">$${safeTax.toFixed(2)}</td>
</tr>

<!-- TOTAL -->
<tr class="grand-total">
  <td>Total</td>
  <td class="right">$${safeTotal.toFixed(2)}</td>
</tr>

<!-- PAYMENTS -->
${
  payments?.length
    ? `
    ${
      totalProcessingFee > 0
        ? `
<tr class="payment">
  <td>Processing Fee</td>
  <td class="right">+$${totalProcessingFee.toFixed(2)}</td>
</tr>


      <tr class="payment">
        <td><strong>Total Charged</strong></td>
        <td class="right"><strong>$${totalCharged.toFixed(2)}</strong></td>
      </tr>
      `
        : ""
    }

    <tr class="balance">
      <td>Balance Due</td>
      <td class="right">$${safeBalance.toFixed(2)}</td>
    </tr>
  `
    : `
    <tr class="balance">
      <td>Balance Due</td>
      <td class="right">$${safeTotal.toFixed(2)}</td>
    </tr>
  `
}




</table>

</div>
<div class="invoice-bottom-line-bottom"></div>

    </div>

  </div>


</div> <!-- 👈 CIERRA invoice-page -->


</div>
 
</body>
</html>
`;
}
