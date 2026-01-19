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

  // 🔒 SOLO proteger dominio interno
  if (hostname === "app.freddygraphics.com") {
    // ✅ COOKIE REAL DE NEXTAUTH
    const session =
      req.cookies.get("__Secure-next-auth.session-token") ||
      req.cookies.get("next-auth.session-token");

    // permitir login
    if (pathname === "/login") {
      return NextResponse.next();
    }

    // bloquear todo lo demás si no hay sesión
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
