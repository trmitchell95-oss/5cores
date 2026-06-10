import { NextRequest, NextResponse } from "next/server";

const IDEANATOR_HOSTS = new Set([
  "theideanator.com",
  "www.theideanator.com",
]);

const HOVEL_EDITOR_HOST = "https://www.hoveleditor.com";

const HOVEL_ONLY_PATHS = [
  "/dashboard",
  "/sphinx",
  "/projects",
  "/reread",
  "/admin",
];

function isHovelOnlyPath(pathname: string) {
  return HOVEL_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() || "";
  const { pathname, search } = request.nextUrl;

  if (!IDEANATOR_HOSTS.has(host)) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/the-ideanator";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && !request.nextUrl.searchParams.get("next")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/idea");
    return NextResponse.redirect(url);
  }

  if (pathname === "/help") {
    const url = request.nextUrl.clone();
    url.pathname = "/idea/help";
    return NextResponse.rewrite(url);
  }

  if (isHovelOnlyPath(pathname)) {
    return NextResponse.redirect(`${HOVEL_EDITOR_HOST}${pathname}${search}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/help",
    "/dashboard/:path*",
    "/sphinx/:path*",
    "/projects/:path*",
    "/reread/:path*",
    "/admin/:path*",
  ],
};