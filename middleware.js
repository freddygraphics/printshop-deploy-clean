import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware() {}, {
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quotes/:path*",
    "/invoices/:path*",
    "/jobs/:path*",
    "/orders/:path*",
    "/settings/:path*",
  ],
};
