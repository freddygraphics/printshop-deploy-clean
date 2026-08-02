export async function buildQuoteHtml({
  quoteId,
  quoteNumber,
  quoteDate,
  validUntil,
  status,
  client,
  items = [],
  subtotal,
  tax,
  total,
  notes,
}) {
  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const itemRows = items
    .map((item, index) => {
      const quantity = Number(item.qty ?? item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice || 0);
      const lineTotal = Number(item.total ?? quantity * unitPrice);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${item.name || item.description || "Item"}</strong>
            ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ""}
          </td>
          <td class="right">${quantity}</td>
          <td class="right">${formatMoney(unitPrice)}</td>
          <td class="right">${formatMoney(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Quote ${quoteNumber}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f3f4f6;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
          }

          .toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 12px 20px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
          }

          .button {
            border: 0;
            border-radius: 7px;
            padding: 10px 16px;
            background: #111827;
            color: white;
            font-weight: 600;
            cursor: pointer;
          }

          .page {
            width: 8.5in;
            min-height: 11in;
            margin: 24px auto;
            padding: 0.55in;
            background: white;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.12);
          }

          .header {
            display: flex;
            justify-content: space-between;
            border-bottom: 2px solid #111827;
            padding-bottom: 18px;
          }

          .company-name {
            font-size: 20px;
            font-weight: 700;
          }

          .quote-title {
            font-size: 30px;
            font-weight: 700;
            text-align: right;
          }

          .quote-number {
            margin-top: 4px;
            text-align: right;
            color: #6b7280;
          }

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 28px;
          }

          .label {
            margin-bottom: 4px;
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .value {
            margin-bottom: 8px;
          }

          table {
            width: 100%;
            margin-top: 30px;
            border-collapse: collapse;
          }

          th {
            background: #f3f4f6;
            color: #4b5563;
            font-size: 11px;
            text-transform: uppercase;
          }

          th,
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }

          .right {
            text-align: right;
          }

          .item-notes {
            margin-top: 4px;
            color: #6b7280;
            font-size: 12px;
          }

          .bottom {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-top: 30px;
          }

          .notes {
            width: 58%;
            color: #4b5563;
            font-size: 13px;
          }

          .totals {
            width: 260px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
          }

          .grand-total {
            margin-top: 5px;
            padding-top: 12px;
            border-top: 2px solid #111827;
            font-size: 18px;
            font-weight: 700;
          }

          @page {
            size: Letter;
            margin: 0;
          }

          @media print {
            body {
              background: white;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: 8.5in;
              min-height: 11in;
              margin: 0;
              box-shadow: none;
            }

            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button class="button" onclick="window.print()">
            Print / Save PDF
          </button>
        </div>

        <main class="page">
          <header class="header">
            <div>
              <div class="company-name">Freddy Graphics LLC</div>
              <div>217 Ferry St, Suite 6</div>
              <div>Newark, NJ 07105</div>
              <div>(862) 208-4041</div>
              <div>info@freddygraphics.com</div>
            </div>

            <div>
              <div class="quote-title">QUOTE</div>
              <div class="quote-number">#${quoteNumber}</div>
            </div>
          </header>

          <section class="details">
            <div>
              <div class="label">Prepared for</div>
              <div class="value">
                <strong>${client?.name || client?.company || "Customer"}</strong>
              </div>

              ${client?.company ? `<div>${client.company}</div>` : ""}
              ${client?.email ? `<div>${client.email}</div>` : ""}
              ${client?.phone ? `<div>${client.phone}</div>` : ""}
            </div>

            <div>
              <div class="label">Quote date</div>
              <div class="value">${formatDate(quoteDate)}</div>

              <div class="label">Valid until</div>
              <div class="value">${formatDate(validUntil)}</div>

              <div class="label">Status</div>
              <div class="value">${status || "Draft"}</div>
            </div>
          </section>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Unit price</th>
                <th class="right">Total</th>
              </tr>
            </thead>

            <tbody>
              ${
                itemRows ||
                `
                  <tr>
                    <td colspan="5" style="text-align:center;">
                      No items found
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>

          <section class="bottom">
            <div class="notes">
              <div class="label">Notes</div>
              <div>${notes || "This quote is subject to customer approval."}</div>
            </div>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${formatMoney(subtotal)}</span>
              </div>

              <div class="total-row">
                <span>Sales tax</span>
                <span>${formatMoney(tax)}</span>
              </div>

              <div class="total-row grand-total">
                <span>Total</span>
                <span>${formatMoney(total)}</span>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  `;
}
