import type { DashboardPayload, DocumentItem, MatchResult, Program, Source, TaskItem } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
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
  submitProfile: (payload: unknown) =>
    request<DashboardPayload>("/api/profiles", { method: "POST", body: JSON.stringify(payload) }),
  getDashboard: (userId: string) => request<DashboardPayload>(`/api/profiles/${userId}/dashboard`),
  getMatches: (userId: string) => request<MatchResult[]>(`/api/profiles/${userId}/matches`),
  saveItem: (payload: unknown) => request<Record<string, string>>("/api/saved-items", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (taskId: string, payload: unknown) =>
    request<TaskItem>(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getAdminSources: () => request<Source[]>("/api/admin/sources"),
};
