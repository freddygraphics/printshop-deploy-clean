import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // -----------------------------
  // 🔓 RUTAS PÚBLICAS
  // -----------------------------
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/pickup/")
  ) {
    return NextResponse.next();
  }

  // -----------------------------
  // 🔐 VERIFICAR SESIÓN
  // -----------------------------
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  // si no hay sesión → login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // si ya está logueado y entra a /login → dashboard
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// -----------------------------
// 🔒 SOLO PROTEGER ESTAS RUTAS
// -----------------------------
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/jobs/:path*",
    "/clients/:path*",
    "/invoices/:path*",
    "/settings/:path*",
  ],
};
