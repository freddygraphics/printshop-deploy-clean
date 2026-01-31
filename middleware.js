import { NextResponse } from "next/server";

export function middleware(req) {
  const hostname = req.headers.get("host");
  const { pathname } = req.nextUrl;

  // 🔓 Siempre permitir assets y APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 🔓 RUTAS PÚBLICAS (CLIENTES)
  if (
    pathname === "/login" ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/pickup/")
  ) {
    return NextResponse.next();
  }

  // 🔒 SOLO proteger dashboard interno
  if (hostname === "app.freddygraphics.com") {
    const session =
      req.cookies.get("__Secure-next-auth.session-token") ||
      req.cookies.get("next-auth.session-token");

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
