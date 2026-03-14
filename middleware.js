import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host");

  // 🔓 Permitir assets y APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 🔓 Rutas públicas
  if (
    pathname === "/login" ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/pickup/")
  ) {
    return NextResponse.next();
  }

  // 🔒 Solo proteger dashboard
  if (hostname?.includes("app.freddygraphics.com")) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/clients/:path*",
    "/invoices/:path*",
    "/settings/:path*",
  ],
};
