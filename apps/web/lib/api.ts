import type {
  AdminFoundersResponse,
  AdminLead,
  DashboardPayload,
  DocumentItem,
  MatchResult,
  ProfileSubmitResponse,
  Program,
  Source,
  TaskItem,
  WaitlistInput,
  WaitlistLead,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const { token: _token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("We could not load that information. Please try again.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getPrograms: () => request<Program[]>("/api/programs"),
  getProgram: (id: string) => request<Program>(`/api/programs/${id}`),
  getDocuments: () => request<DocumentItem[]>("/api/documents"),
  getDocument: (id: string) => request<DocumentItem>(`/api/documents/${id}`),
  submitProfile: (payload: unknown, token?: string) =>
    request<ProfileSubmitResponse>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    }),
  getDashboard: (userId: string, token?: string) =>
    request<DashboardPayload>(`/api/profiles/${userId}/dashboard`, { token }),
  getMatches: (userId: string, token?: string) =>
    request<MatchResult[]>(`/api/profiles/${userId}/matches`, { token }),
  saveItem: (payload: unknown, token?: string) =>
    request<Record<string, string>>("/api/saved-items", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    }),
  updateTask: (taskId: string, payload: unknown, token?: string) =>
    request<TaskItem>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      token,
    }),
  getAdminSources: (token?: string) => request<Source[]>("/api/admin/sources", { token }),
  joinWaitlist: (payload: WaitlistInput) =>
    fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const body = (await response.json()) as WaitlistLead & { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "We could not save your waitlist signup.");
      }
      return body;
    }),
  startFounderCheckout: (payload: { email: string; userId: string }) =>
    fetch("/api/checkout/founder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Checkout could not be started.");
      }
      if (!body.url) {
        throw new Error("Checkout URL was not returned.");
      }
      return body.url;
    }),
  getAdminLeads: (token: string) => request<AdminLead[]>("/api/admin/leads", { token }),
  getAdminFounders: (token: string) => request<AdminFoundersResponse>("/api/admin/founders", { token }),
};

export async function getAccessToken(): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
