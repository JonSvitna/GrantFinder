import { isProductPath } from "@/lib/navigation";
import { fetchSubscription, isAdminEmail } from "@/lib/subscription";

export async function resolvePostLoginPath(options: {
  next?: string | null;
  accessToken: string;
  email?: string | null;
}): Promise<string> {
  const normalizedNext =
    options.next?.startsWith("/") && !options.next.startsWith("//") ? options.next : null;

  let email = options.email?.trim().toLowerCase() || undefined;
  let subscriptionStatus: string | undefined;

  try {
    const subscription = await fetchSubscription(options.accessToken);
    email = email || subscription.email?.toLowerCase();
    subscriptionStatus = subscription.status;
  } catch {
    // Fall through to admin/checkout routing without subscription data.
  }

  if (normalizedNext?.startsWith("/admin/") && isAdminEmail(email)) {
    return normalizedNext;
  }

  if (isAdminEmail(email)) {
    if (normalizedNext && isProductPath(normalizedNext)) {
      return normalizedNext;
    }
    return "/admin/leads";
  }

  if (subscriptionStatus === "active") {
    if (normalizedNext && isProductPath(normalizedNext)) {
      return normalizedNext;
    }
    return "/dashboard";
  }

  return "/founder/checkout";
}
