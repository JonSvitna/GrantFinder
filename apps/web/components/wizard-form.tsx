"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ProfilePayload } from "@/lib/types";
import { isPreviewResponse } from "@/lib/types";

const DRAFT_KEY = "smbfn_wizard_draft";
const PREVIEW_KEY = "smbfn_unlock_preview";

const counties = ["Baltimore City", "Baltimore County", "Montgomery County", "Prince George's County", "Anne Arundel County", "Frederick County", "Howard County", "Other Maryland county"];
const fundingNeeds = ["startup capital", "working capital", "equipment", "hiring", "training", "marketing", "real estate", "energy savings", "government contracting"];
const ownershipOptions = ["minority-owned", "woman-owned", "veteran-owned"];

const initialProfile: ProfilePayload = {
  email: "",
  business_name: "",
  county: "Baltimore County",
  stage: "startup",
  industry: "professional services",
  entity_type: "LLC",
  revenue_range: "pre-revenue",
  employee_count: 1,
  hiring_plans: false,
  funding_needs: ["startup capital"],
  has_ein: false,
  has_business_bank_account: false,
  has_w9: false,
  has_sam_registration: false,
  has_emma_account: false,
  interested_in_government_contracts: false,
  ownership_statuses: [],
  location_type: "urban",
};

export function WizardForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfilePayload>(initialProfile);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = useMemo(
    () => [
      "Business basics",
      "Location and stage",
      "Funding needs",
      "Paperwork",
      "Procurement",
      "Certifications",
      "Review",
    ],
    []
  );

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return;
    }
    try {
      const draft = JSON.parse(raw) as { step?: number; profile?: ProfilePayload };
      if (draft.profile) {
        setProfile(draft.profile);
      }
      if (typeof draft.step === "number") {
        setStep(Math.min(Math.max(draft.step, 0), steps.length - 1));
      }
    } catch {
      // Ignore malformed draft payloads.
    }
  }, [steps.length]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, profile }));
  }, [step, profile]);

  function update<K extends keyof ProfilePayload>(key: K, value: ProfilePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "funding_needs" | "ownership_statuses", value: string) {
    setProfile((current) => {
      const existing = new Set(current[key]);
      if (existing.has(value)) {
        existing.delete(value);
      } else {
        existing.add(value);
      }
      return { ...current, [key]: Array.from(existing) };
    });
  }

  async function submit() {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.submitProfile(profile);
      localStorage.setItem("smbfn_user_id", response.user.id);

      if (isPreviewResponse(response)) {
        sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(response));
        router.push("/wizard/unlock");
        return;
      }

      localStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(PREVIEW_KEY);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not generate your plan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel" style={{ display: "grid", gap: 24, padding: 24 }}>
      <div>
        <div style={{ color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>
          Step {step + 1} of {steps.length}
        </div>
        <h1 style={{ marginBottom: 8, marginTop: 8 }}>{steps[step]}</h1>
        <div style={{ background: "#e8eef4", borderRadius: 999, height: 10, overflow: "hidden" }}>
          <div style={{ background: "var(--green)", height: "100%", width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Email">
            <input className="panel" required style={inputStyle} type="email" value={profile.email} onChange={(event) => update("email", event.target.value)} />
          </Field>
          <Field label="Business name">
            <input className="panel" required style={inputStyle} value={profile.business_name} onChange={(event) => update("business_name", event.target.value)} />
          </Field>
          <Field label="Industry">
            <input className="panel" style={inputStyle} value={profile.industry} onChange={(event) => update("industry", event.target.value)} />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="County in Maryland">
            <select className="panel" style={inputStyle} value={profile.county} onChange={(event) => update("county", event.target.value)}>
              {counties.map((county) => (
                <option key={county}>{county}</option>
              ))}
            </select>
          </Field>
          <Field label="Business stage">
            <select className="panel" style={inputStyle} value={profile.stage} onChange={(event) => update("stage", event.target.value)}>
              {["idea", "startup", "active", "expanding"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Entity type">
            <select className="panel" style={inputStyle} value={profile.entity_type} onChange={(event) => update("entity_type", event.target.value)}>
              {["sole proprietor", "LLC", "corporation", "nonprofit"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Revenue range">
            <select className="panel" style={inputStyle} value={profile.revenue_range} onChange={(event) => update("revenue_range", event.target.value)}>
              {["pre-revenue", "$1-$50k", "$50k-$250k", "$250k-$1M", "$1M+"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Number of employees">
            <input className="panel" min={0} style={inputStyle} type="number" value={profile.employee_count} onChange={(event) => update("employee_count", Number(event.target.value))} />
          </Field>
          <Checkbox label="Planning to hire or train workers" checked={profile.hiring_plans} onChange={(value) => update("hiring_plans", value)} />
          <CheckGrid options={fundingNeeds} selected={profile.funding_needs} onToggle={(value) => toggleList("funding_needs", value)} />
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "grid", gap: 12 }}>
          <Checkbox label="Has EIN" checked={profile.has_ein} onChange={(value) => update("has_ein", value)} />
          <Checkbox label="Has business bank account" checked={profile.has_business_bank_account} onChange={(value) => update("has_business_bank_account", value)} />
          <Checkbox label="Has W-9" checked={profile.has_w9} onChange={(value) => update("has_w9", value)} />
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "grid", gap: 12 }}>
          <Checkbox label="Interested in government contracts" checked={profile.interested_in_government_contracts} onChange={(value) => update("interested_in_government_contracts", value)} />
          <Checkbox label="Has SAM.gov registration" checked={profile.has_sam_registration} onChange={(value) => update("has_sam_registration", value)} />
          <Checkbox label="Has eMMA account" checked={profile.has_emma_account} onChange={(value) => update("has_emma_account", value)} />
        </div>
      )}

      {step === 5 && (
        <div style={{ display: "grid", gap: 16 }}>
          <CheckGrid options={ownershipOptions} selected={profile.ownership_statuses} onToggle={(value) => toggleList("ownership_statuses", value)} />
          <Field label="Location type">
            <select className="panel" style={inputStyle} value={profile.location_type ?? ""} onChange={(event) => update("location_type", event.target.value)}>
              <option value="urban">urban</option>
              <option value="rural">rural</option>
              <option value="">not sure</option>
            </select>
          </Field>
        </div>
      )}

      {step === 6 && (
        <div className="panel" style={{ background: "#f8faf8", padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Ready to generate your plan</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
            We will compare your profile to seeded Maryland-first programs and paperwork steps. Results use cautious language and link to official sources.
          </p>
          <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
            <li>{profile.business_name || "Your business"} in {profile.county}</li>
            <li>{profile.stage} {profile.entity_type}</li>
            <li>{profile.funding_needs.join(", ")}</li>
          </ul>
        </div>
      )}

      {error ? <div style={{ color: "#b42318", fontWeight: 700 }}>{error}</div> : null}

      <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
        <button className="button-secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button">
          Back
        </button>
        {step < steps.length - 1 ? (
          <button className="button-primary" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} type="button">
            Continue
          </button>
        ) : (
          <button className="button-primary" disabled={isSubmitting || !profile.email || !profile.business_name} onClick={submit} type="button">
            {isSubmitting ? "Generating..." : "Generate plan"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
      {label}
      {children}
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="panel" style={{ alignItems: "center", cursor: "pointer", display: "flex", gap: 12, padding: 14 }}>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span style={{ fontWeight: 700 }}>{label}</span>
    </label>
  );
}

function CheckGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      {options.map((option) => (
        <button
          className={selected.includes(option) ? "button-primary" : "button-secondary"}
          key={option}
          onClick={() => onToggle(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const inputStyle = {
  border: "1px solid var(--border)",
  minHeight: 44,
  padding: "0 12px",
  width: "100%",
};
