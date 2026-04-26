export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter") || "thismonth";

    const now = new Date();

    let dateFilter = {};

    // 🔥 QUERY FINAL
    const invoices = await prisma.invoice.findMany({
      where: {
        paymentStatus: {
          not: "VOID",
        },
        ...dateFilter,
      },
      include: {
        payments: true,
      },
    });

    let total = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    invoices.forEach((inv) => {
      const invoiceTotal = Number(inv.total ?? 0);

      const paymentsTotal = (inv.payments || []).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0,
      );

      const balance = invoiceTotal - paymentsTotal;

      total += invoiceTotal;

      if (balance <= 0.01) {
        paid += invoiceTotal;
        return;
      }

      if (balance > 0) {
        pending += balance;
      }

      if (inv.dueDate) {
        const due = new Date(inv.dueDate);
        if (!isNaN(due) && due < now) {
          overdue += balance;
        }
      }
    });

    return NextResponse.json({ total, paid, pending, overdue });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
