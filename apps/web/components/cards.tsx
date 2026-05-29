import Link from "next/link";
import type { DocumentItem, MatchResult, Program, TaskItem } from "@/lib/types";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <article className="panel" style={{ display: "grid", gap: 10, padding: 18 }}>
      <div style={{ color: "var(--green)", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>{program.funding_type}</div>
      <h3 style={{ margin: 0 }}>{program.name}</h3>
      <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{program.best_fit}</p>
      <div style={{ color: "var(--muted)", display: "flex", flexWrap: "wrap", fontSize: 13, gap: 10 }}>
        <span>{program.difficulty}</span>
        <span>{program.estimated_time}</span>
        <span>{program.confidence}</span>
      </div>
      <Link className="button-secondary" href={`/funding/${program.id}`} style={{ width: "fit-content" }}>
        Review program
      </Link>
    </article>
  );
}

export function DocumentCard({ document }: { document: DocumentItem }) {
  return (
    <article className="panel" style={{ display: "grid", gap: 10, padding: 18 }}>
      <div style={{ color: "var(--blue)", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>{document.category}</div>
      <h3 style={{ margin: 0 }}>{document.name}</h3>
      <p style={{ color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{document.summary}</p>
      <Link className="button-secondary" href={`/paperwork/${document.id}`} style={{ width: "fit-content" }}>
        Open guide
      </Link>
    </article>
  );
}

export function TaskRow({ task }: { task: TaskItem }) {
  return (
    <div className="panel" style={{ alignItems: "start", display: "grid", gap: 8, padding: 16 }}>
      <strong>{task.title}</strong>
      <p style={{ color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{task.description}</p>
      <span style={{ color: task.status === "complete" ? "var(--green)" : "var(--blue)", fontSize: 13, fontWeight: 800 }}>{task.status}</span>
    </div>
  );
}

function formatTaskStatus(status: string) {
  if (status === "complete") {
    return "Complete";
  }
  if (status === "in_progress") {
    return "In progress";
  }
  return "Not started";
}

function taskStatusColor(status: string) {
  if (status === "complete") {
    return "var(--green)";
  }
  if (status === "in_progress") {
    return "var(--blue)";
  }
  return "var(--muted)";
}

export function PriorityTaskRow({ task }: { task: TaskItem }) {
  return (
    <div className="task-chip">
      <strong style={{ fontSize: 13 }}>{task.title}</strong>
      <span style={{ color: taskStatusColor(task.status), fontSize: 11, fontWeight: 700 }}>{formatTaskStatus(task.status)}</span>
    </div>
  );
}

export function MatchRow({ match }: { match: MatchResult }) {
  return (
    <div className="match-row">
      <span className="match-badge">Match</span>
      <div style={{ display: "grid", gap: 2 }}>
        <strong style={{ fontSize: 14 }}>{match.program.name}</strong>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          {match.program.funding_type} · {match.program.estimated_time}
        </span>
      </div>
    </div>
  );
}
