export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return (
    Boolean(url && anonKey) &&
    !url.includes("placeholder") &&
    !anonKey.includes("placeholder") &&
    url.includes("supabase.co")
  );
}

export function signInErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your inbox and confirm your email before signing in.";
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function signUpErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered")
  ) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("rate") || lower.includes("too many") || lower.includes("over_email_send_rate_limit")) {
    return "Too many emails sent. Wait a minute and try again.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("signup") || lower.includes("signups")) {
    return "Sign-ups are disabled for this project. Ask an admin to enable email sign-in in Supabase Auth settings.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function resetPasswordErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("expired") || lower.includes("invalid")) {
    return "This link expired. Request a new reset link.";
  }
  if (lower.includes("invalid api key")) {
    return "Copy fresh anon key from Supabase into `.env.local` and restart dev server.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That email address looks invalid. Check for typos and try again.";
  }
  return message;
}

export function updatePasswordErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("password") && (lower.includes("short") || lower.includes("least"))) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("same") && lower.includes("password")) {
    return "Choose a different password than your current one.";
  }
  if (lower.includes("session") || lower.includes("expired")) {
    return "This link expired. Request a new reset link.";
  }
  return message;
}
