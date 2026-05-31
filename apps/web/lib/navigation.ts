export const PRODUCT_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/funding", label: "Funding Matches" },
  { href: "/paperwork", label: "Paperwork Navigator" },
  { href: "/tasks", label: "Forms & Tasks" },
] as const;

export const ADMIN_NAV = [
  {
    section: "Overview",
    items: [{ href: "/admin/leads", label: "Waitlist leads" }],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/founders", label: "Founder roster" },
      { href: "/admin/sources", label: "Source management" },
    ],
  },
] as const;

export const MARKETING_NAV = [
  { href: "/funding", label: "Funding", productLink: true },
  { href: "/paperwork", label: "Paperwork", productLink: true },
  { href: "/#features", label: "Incentives", productLink: false },
  { href: "/#how-it-works", label: "Resources", productLink: false },
  { href: "/#about", label: "About", productLink: false },
] as const;

export const PRODUCT_PATHS = PRODUCT_NAV.map((item) => item.href);
export const ADMIN_PATHS = ["/admin/leads", "/admin/founders", "/admin/sources"];
export const MARKETING_PATHS = ["/", "/login", "/wizard", "/founder", "/waitlist", "/auth"];

export type ShellType = "marketing" | "product" | "admin";

export function isProductPath(pathname: string): boolean {
  return PRODUCT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function resolveShell(
  pathname: string,
  ctx: { isSignedIn: boolean; isAdmin: boolean; hasActiveSub: boolean }
): ShellType {
  if (isAdminPath(pathname)) {
    return "admin";
  }
  if (isProductPath(pathname)) {
    if (ctx.isSignedIn && (ctx.isAdmin || ctx.hasActiveSub)) {
      return "product";
    }
    return "marketing";
  }
  return "marketing";
}

export function resolveRoleHome(ctx: { isAdmin: boolean; hasActiveSub: boolean }): string {
  if (ctx.isAdmin) {
    return "/admin/leads";
  }
  if (ctx.hasActiveSub) {
    return "/dashboard";
  }
  return "/founder/checkout";
}
