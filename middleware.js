import { NextResponse } from "next/server";

export function middleware(req) {
  const hostname = req.headers.get("host");
  const { pathname } = req.nextUrl;

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

  // 🔒 Dashboard interno
  if (hostname?.includes("app.freddygraphics.com")) {
    const sessionToken =
      req.cookies.get("__Secure-next-auth.session-token")?.value ||
      req.cookies.get("next-auth.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
