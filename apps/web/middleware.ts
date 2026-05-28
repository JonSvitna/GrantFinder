import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { fetchSubscription, isAdminEmail } from "@/lib/subscription";

const gatedPaths = ["/dashboard", "/funding", "/tasks"];
const adminPaths = ["/admin/leads", "/admin/founders", "/admin/sources"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const needsAuth = gatedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const needsAdmin = adminPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!needsAuth && !needsAdmin) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin && !isAdminEmail(user.email)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  if (needsAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const subscription = await fetchSubscription(session.access_token);
      if (subscription.status !== "active") {
        const checkoutUrl = request.nextUrl.clone();
        checkoutUrl.pathname = "/founder/checkout";
        return NextResponse.redirect(checkoutUrl);
      }
    } catch {
      const checkoutUrl = request.nextUrl.clone();
      checkoutUrl.pathname = "/founder/checkout";
      return NextResponse.redirect(checkoutUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/funding/:path*", "/tasks/:path*", "/admin/:path*"],
};
