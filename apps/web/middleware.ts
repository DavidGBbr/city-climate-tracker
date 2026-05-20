import { NextRequest, NextResponse } from "next/server";

import { ADMIN_TOKEN_COOKIE } from "@/lib/auth-constants";

/**
 * Guards /admin/* by requiring the admin_token cookie set after a successful
 * login. The cookie is opaque to the middleware on purpose: signature
 * verification happens on the API side (require_admin dep) — here we only gate
 * navigation. Unauthenticated requests are redirected to /admin/login.
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  const token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
