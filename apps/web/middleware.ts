import { NextRequest, NextResponse } from "next/server";

/**
 * Stub authentication for the admin area.
 *
 * Currently a no-op: every request to /admin/* is allowed through. When real
 * auth is wired up, replace ``isAdminAuthenticated`` with a check against a
 * session cookie, JWT, or upstream identity provider — the rest of the file
 * stays the same.
 */
function isAdminAuthenticated(_req: NextRequest): boolean {
  // TODO(auth): inspect session cookie / Authorization header here.
  return true;
}

export function middleware(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "required");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
