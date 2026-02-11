export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req, { params }) {
  const id = Number(params.itemId);
  const body = await req.json();

  await prisma.invoiceItem.update({
    where: { id },
    data: {
      name: body.name,
      qty: body.qty,
      unitPrice: body.unitPrice,
      total: body.total,
      options: body.options, // ðŸ‘ˆ AQUÃ SE GUARDAN LOS CONFIGURABLES
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  await prisma.invoiceItem.delete({
    where: { id: Number(params.itemId) },
  });
  return NextResponse.json({ ok: true });
}


