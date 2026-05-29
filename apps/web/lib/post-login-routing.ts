import { fetchSubscription, isAdminEmail } from "@/lib/subscription";

const GATED_PRODUCT_PATHS = ["/dashboard", "/funding", "/tasks"];

function isGatedProductPath(path: string): boolean {
  return GATED_PRODUCT_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export async function resolvePostLoginPath(options: {
  next?: string | null;
  accessToken: string;
}): Promise<string> {
  const normalizedNext =
    options.next?.startsWith("/") && !options.next.startsWith("//") ? options.next : null;

  let email: string | undefined;
  let subscriptionStatus: string | undefined;

  try {
    const subscription = await fetchSubscription(options.accessToken);
    email = subscription.email;
    subscriptionStatus = subscription.status;
  } catch {
    // Fall through to admin/checkout routing without subscription data.
  }

  if (normalizedNext?.startsWith("/admin/") && isAdminEmail(email)) {
    return normalizedNext;
  }

  if (subscriptionStatus === "active") {
    if (normalizedNext && isGatedProductPath(normalizedNext)) {
      return normalizedNext;
    }
    return "/dashboard";
  }

  if (isAdminEmail(email)) {
    return "/admin/leads";
  }

  return "/founder/checkout";
}
