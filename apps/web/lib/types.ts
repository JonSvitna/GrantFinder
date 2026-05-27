export interface Source {
  id: string;
  name: string;
  agency: string;
  url: string;
  jurisdiction: string;
  source_type: string;
  last_checked_at?: string;
  notes?: string;
  program_count?: number;
  document_count?: number;
}

export interface Program {
  id: string;
  name: string;
  funding_type: string;
  category: string;
  best_fit: string;
  eligibility_summary: string;
  required_documents: string[];
  difficulty: string;
  estimated_time: string;
  official_url: string;
  last_checked_at?: string;
  confidence: string;
  next_action: string;
  source?: Source;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  summary: string;
  who_needs_it: string;
  why_it_matters: string;
  required_information: string[];
  common_mistakes: string[];
  official_url: string;
  steps: string[];
  source?: Source;
}

export interface ReadinessScore {
  label: string;
  score: number;
  reason: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
}

export interface MatchResult {
  program: Program;
  score: number;
  confidence: string;
  fit_reason: string;
  next_action: string;
}

export interface ProfilePayload {
  email: string;
  business_name: string;
  county: string;
  stage: string;
  industry: string;
  entity_type: string;
  revenue_range: string;
  employee_count: number;
  hiring_plans: boolean;
  funding_needs: string[];
  has_ein: boolean;
  has_business_bank_account: boolean;
  has_w9: boolean;
  has_sam_registration: boolean;
  has_emma_account: boolean;
  interested_in_government_contracts: boolean;
  ownership_statuses: string[];
  location_type?: string | null;
}

export interface DashboardPayload {
  user: { id: string; email: string };
  profile: ProfilePayload & { user_id: string };
  readiness: Record<string, ReadinessScore> & { missing_paperwork: string[] };
  matches: MatchResult[];
  tasks: TaskItem[];
  saved_items: Array<Record<string, string>>;
  priority_actions: TaskItem[];
}

export interface PreviewDashboardPayload {
  preview: true;
  user: { id: string; email: string };
  categories: Array<{ key: string; label: string; reason: string }>;
  spots_remaining: number;
  cap_reached: boolean;
}

export type ProfileSubmitResponse = DashboardPayload | PreviewDashboardPayload;

export interface WaitlistInput {
  email: string;
  first_name: string;
  source: "landing_hero" | "landing_footer" | "paywall" | "founder_page";
}

export interface WaitlistLead {
  email: string;
  first_name: string;
  source: string;
}

export interface AdminLead {
  email: string;
  first_name: string;
  source: string;
  created_at: string;
}

export interface AdminFoundersResponse {
  seat_count: number;
  cap: number;
  founders: Array<{
    founder_number: number;
    email: string;
    first_name: string | null;
    subscription_status: string;
    subscribed_at: string | null;
  }>;
}

export function isPreviewResponse(response: ProfileSubmitResponse): response is PreviewDashboardPayload {
  return "preview" in response && response.preview === true;
}
