import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_PATHS, PRODUCT_PATHS, resolveRoleHome } from "@/lib/navigation";
import { updateSession } from "@/lib/supabase/middleware";
import { fetchSubscription, isAdminEmail } from "@/lib/subscription";

function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

async function resolveHasActiveSub(
  supabase: Awaited<ReturnType<typeof updateSession>>["supabase"],
  user: NonNullable<Awaited<ReturnType<typeof updateSession>>["user"]>
): Promise<boolean> {
  if (isAdminEmail(user.email)) {
    return true;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return false;
  }

  try {
    const subscription = await fetchSubscription(session.access_token);
    return subscription.status === "active";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/founder/checkout") && user && isAdminEmail(user.email)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin/leads";
    return NextResponse.redirect(adminUrl);
  }

  if (user && (pathname === "/" || pathname === "/login")) {
    const isAdmin = isAdminEmail(user.email);
    const hasActiveSub = await resolveHasActiveSub(supabase, user);
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = resolveRoleHome({ isAdmin, hasActiveSub });
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  const needsAuth = matchesPath(pathname, PRODUCT_PATHS);
  const needsAdmin = matchesPath(pathname, ADMIN_PATHS);

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
    if (isAdminEmail(user.email)) {
      return supabaseResponse;
    }

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
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/funding/:path*",
    "/paperwork/:path*",
    "/tasks/:path*",
    "/admin/:path*",
    "/founder/checkout",
  ],
};
