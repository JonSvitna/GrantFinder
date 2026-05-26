"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import type { TaskItem } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("smbfn_user_id");
    if (!userId) {
      setMessage("Complete the wizard first to generate tasks.");
      return;
    }
    api.getDashboard(userId).then((dashboard) => setTasks(dashboard.tasks)).catch(() => setMessage("Tasks are unavailable."));
  }, []);

  async function toggleTask(task: TaskItem) {
    const nextStatus = task.status === "complete" ? "open" : "complete";
    const updated = await api.updateTask(task.id, { status: nextStatus });
    setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 20 }}>
        <header>
          <h1 style={{ marginBottom: 8 }}>Saved checklist and tasks</h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>Track the next paperwork, funding, and procurement steps.</p>
        </header>
        {message ? (
          <div className="panel" style={{ padding: 20 }}>
            <p style={{ color: "var(--muted)" }}>{message}</p>
            <Link className="button-primary" href="/wizard">Start wizard</Link>
          </div>
        ) : null}
        <section style={{ display: "grid", gap: 12 }}>
          {tasks.map((task) => (
            <div className="panel" key={task.id} style={{ alignItems: "center", display: "grid", gap: 14, gridTemplateColumns: "1fr auto", padding: 16 }}>
              <div>
                <strong>{task.title}</strong>
                <p style={{ color: "var(--muted)", lineHeight: 1.5, marginBottom: 0 }}>{task.description}</p>
              </div>
              <button className={task.status === "complete" ? "button-secondary" : "button-primary"} onClick={() => toggleTask(task)} type="button">
                {task.status === "complete" ? "Reopen" : "Complete"}
              </button>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
