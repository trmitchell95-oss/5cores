import { NextRequest, NextResponse } from "next/server";

const IDEANATOR_HOSTS = new Set([
  "theideanator.com",
  "www.theideanator.com",
]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() || "";
  const { pathname } = request.nextUrl;

  if (IDEANATOR_HOSTS.has(host) && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/idea";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
