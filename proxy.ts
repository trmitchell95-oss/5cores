import { NextRequest, NextResponse } from "next/server";

/**
 * Unified Hovel Ideas Workshop proxy.
 *
 * Old behavior fenced The Ideanator away from Hovel Editor tools by redirecting
 * /dashboard, /sphinx, /projects, /reread, and /admin to hoveleditor.com.
 *
 * New behavior: both domains are front doors into the same workshop.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sphinx/:path*",
    "/projects/:path*",
    "/reread/:path*",
    "/admin/:path*",
    "/idea/:path*",
    "/ideanator/:path*",
    "/saved-ideas/:path*",
    "/rigs/:path*",
  ],
};
