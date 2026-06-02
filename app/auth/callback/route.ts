import { NextRequest, NextResponse } from "next/server";

function isIdeanatorHost(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() || "";

  return host === "theideanator.com" || host === "www.theideanator.com";
}

function getDefaultDestination(request: NextRequest) {
  return isIdeanatorHost(request) ? "/idea" : "/dashboard";
}

function getSafeNextPath(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "";

  if (!next) {
    return getDefaultDestination(request);
  }

  try {
    const decoded = decodeURIComponent(next);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return getDefaultDestination(request);
    }

    return decoded;
  } catch {
    return getDefaultDestination(request);
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeNextPath(request);

  if (code) {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
