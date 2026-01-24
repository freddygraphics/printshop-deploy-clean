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
  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td class="item-name">
          <strong>${item.name}</strong><br/>
          <span class="item-desc">${item.description || ""}</span>
        </td>
      <td class="center">${Number(item.qty || 0)}</td>

     <td class="right">$${Number(item.unitPrice || 0).toFixed(2)}</td>
<td class="right"><strong>$${Number(item.total || 0).toFixed(2)}</strong></td>

      </tr>
    `,
    )
    .join("");
  // ============================
  // PAYMENTS + PROCESSING FEES
  // ============================
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalProcessingFee = payments.reduce(
    (sum, p) => sum + Number(p.processingFee || 0),
    0,
  );

  const totalCharged = totalPaid + totalProcessingFee;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
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
    grid-template-columns: 2fr 1fr 1fr;
    gap: 20px;
font-size: 12px;
     margin-top: 15px ;
     margin-bottom: 15px ;
      border-bottom: 2px solid #e5e5e5;
    
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
  border-top: 2px solid #000000;
  padding-top: 8px;
}
.watermark {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 120px;
  font-weight: 800;
  color: rgba(80, 80, 80, 0.06); /* verde suave */
  z-index: 0;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

</style>
</head>

<body>
 <div class="invoice-page">
 ${balance <= 0 ? `<div class="watermark">PAID</div>` : ""}

  <!-- HEADER -->
  <div class="header">
    <div class="company-info">
      <strong>Freddy Graphics LLC</strong><br/>
      217 Ferry St, Suite 5 Newark, NJ 07105<br/>
      info@freddygraphics.com<br/>
      (862) 208-4041
    </div>

  <img src="https://app.freddygraphics.com//logo.png" class="logo" />
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
       ${issuedAt}<p>
      <div class="invoice-due">Due Date:</div>
      ${dueDate || "—"}
    </div>
  </div>

  <hr/>
 <div class="info">
  <!-- CUSTOMER -->
   <div>
  
     <div class="info-company">Company name</div>
        ${client.company || ""}<br/>
      </div>
     
        <div>
     <div class="info-customer">Customer</div>
          ${client.name}
    
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
      <td class="right">$${subtotal.toFixed(2)}</td>
    </tr>

    <!-- DESCUENTO -->
    ${
      discountAmount > 0
        ? `
      <tr class="discount">
        <td>Discount${discountLabel ? ` (${discountLabel})` : ""}</td>
        <td class="right">−$${discountAmount.toFixed(2)}</td>
      </tr>
    `
        : ""
    }

    <!-- TAX -->
    <tr>
      <td>Sales Tax</td>
      <td class="right">$${tax.toFixed(2)}</td>
    </tr>

    <!-- TOTAL -->
    <tr class="grand-total">
      <td>Total</td>
      <td class="right">$${total.toFixed(2)}</td>
    </tr>

    <!-- PAYMENTS -->
       <!-- PAYMENTS -->
    ${
      payments?.length
        ? `
      ${payments
        .map(
          (p) => `
        <tr class="payment">
          <td>Payment (${p.method})</td>
          <td class="right">−$${Number(p.amount || 0).toFixed(2)}</td>
        </tr>

        ${
          p.processingFee && p.processingFee > 0
            ? `
        <tr class="payment">
          <td style="padding-left:12px;font-size:11px;">
            Processing Fee (${p.method})
          </td>
          <td class="right">+$${Number(p.processingFee).toFixed(2)}</td>
        </tr>
        `
            : ""
        }
      `,
        )
        .join("")}

      ${
        totalProcessingFee > 0
          ? `
        <tr class="payment">
          <td><strong>Total Charged</strong></td>
          <td class="right"><strong>$${totalCharged.toFixed(2)}</strong></td>
        </tr>
        `
          : ""
      }

      <tr class="balance">
        <td>Balance Due</td>
        <td class="right">$${balance.toFixed(2)}</td>
      </tr>
    `
        : ""
    }


  </table>
</div>

    </div>
  </div>

</div> <!-- 👈 CIERRA invoice-page -->
</div>
</body>
</html>
`;
}
