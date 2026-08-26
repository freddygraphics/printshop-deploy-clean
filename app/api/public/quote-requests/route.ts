import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedOrigin = "http://localhost:3001";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      businessName,
      email,
      phone,
      productId,
      productName,
      qty,
      options,
      notes,
    } = body;

    if (!name || !email || !productName) {
      return NextResponse.json(
        {
          error: "Name, email and productName are required.",
        },
        {
          status: 400,
          headers: corsHeaders(),
        },
      );
    }

    const parsedQty = Number(qty ?? 1);

    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        {
          error: "Invalid quantity.",
        },
        {
          status: 400,
          headers: corsHeaders(),
        },
      );
    }

    let validProductId: number | null = null;
    let validProductName = String(productName).trim();

    if (productId !== undefined && productId !== null && productId !== "") {
      const parsedProductId = Number(productId);

      if (!Number.isInteger(parsedProductId)) {
        return NextResponse.json(
          {
            error: "Invalid productId.",
          },
          {
            status: 400,
            headers: corsHeaders(),
          },
        );
      }

      const product = await prisma.product.findUnique({
        where: {
          id: parsedProductId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          {
            error: "Product not found.",
          },
          {
            status: 404,
            headers: corsHeaders(),
          },
        );
      }

      validProductId = product.id;
      validProductName = product.name;
    }

    const safeOptions =
      options && typeof options === "object" && !Array.isArray(options)
        ? options
        : {};

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        name: String(name).trim(),

        businessName: businessName ? String(businessName).trim() : null,

        email: String(email).trim().toLowerCase(),

        phone: phone ? String(phone).trim() : null,

        productId: validProductId,

        productName: validProductName,

        qty: parsedQty,

        options: safeOptions,

        notes: notes ? String(notes).trim() : null,

        status: "NEW",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Quote request received.",
        quoteRequest: {
          id: quoteRequest.id,
          status: quoteRequest.status,
          createdAt: quoteRequest.createdAt,
        },
      },
      {
        status: 201,
        headers: corsHeaders(),
      },
    );
  } catch (error) {
    console.error("CREATE QUOTE REQUEST ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to create quote request.",
      },
      {
        status: 500,
        headers: corsHeaders(),
      },
    );
  }
}
