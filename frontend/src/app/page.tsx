"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
};

const statusLabels: Record<Task["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

function CreateTaskForm({ onCreated }: { onCreated: (task: Task) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const title = String(fields.get("title") ?? "").trim();
    if (!title) {
      setError("Enter a task title.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: fields.get("priority") }),
      });
      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Unable to create your task. Please try again.");
      }
      const task: Task = await response.json();
      onCreated(task);
      form.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create your task. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={createTask} className="space-y-3" aria-label="Create task" aria-busy={busy}>
      <div>
        <label htmlFor="task-title" className="mb-1 block text-sm font-medium">Task title</label>
        <input id="task-title" name="title" type="text" required maxLength={255} disabled={busy}
          placeholder="What needs to get done?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="task-priority" className="mb-1 block text-sm font-medium">Priority</label>
        <select id="task-priority" name="priority" defaultValue="medium" disabled={busy}
          className="w-full rounded-lg border border-slate-300 px-3 py-2">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <button type="submit" disabled={busy}
        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50">
        {busy ? "Creating…" : "Create task"}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}

function TaskRow({ task, onUpdated, onDeleted }: {
  task: Task;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [pending, setPending] = useState<"update" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: Task["status"]) {
    if (pending || status === task.status) return;
    setPending("update");
    setError(null);
    try {
      const response = await apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Unable to update task. Please try again.");
      const updated: Task = await response.json();
      onUpdated(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update task.");
    } finally {
      setPending(null);
    }
  }

  async function deleteTask() {
    if (pending) return;
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    setPending("delete");
    setError(null);
    try {
      const response = await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete task. Please try again.");
      onDeleted(task.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete task.");
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="space-y-2 rounded-lg border border-slate-200 p-3" aria-busy={pending !== null}>
      <p className={`font-medium break-words ${task.status === "done" ? "text-slate-500 line-through" : ""}`}>
        {task.title}
      </p>
      <p className="text-sm text-slate-600"><span className="capitalize">{task.priority}</span> priority</p>
      <label htmlFor={`status-${task.id}`} className="block text-sm font-medium">Status</label>
      <select
        id={`status-${task.id}`}
        value={task.status}
        disabled={pending !== null}
        onChange={(event) => void updateStatus(event.target.value as Task["status"])}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
      >
        <option value="todo">{statusLabels.todo}</option>
        <option value="in_progress">{statusLabels.in_progress}</option>
        <option value="done">{statusLabels.done}</option>
      </select>
      {pending === "update" && <p role="status" className="text-sm text-slate-600">Saving…</p>}
      <button type="button" onClick={() => void deleteTask()} disabled={pending !== null}
        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">
        {pending === "delete" ? "Deleting…" : "Delete"}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </li>
  );
}

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await apiFetch("/tasks", { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Unable to load your tasks. Please refresh to try again.");
        }
        const data: Task[] = await response.json();
        if (!controller.signal.aborted) setTasks(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Unable to load your tasks.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTasks();
    return () => controller.abort();
  }, []);


  return (
    <section aria-labelledby="tasks-heading" className="space-y-3 border-t border-slate-200 pt-4">
      <h2 id="tasks-heading" className="text-lg font-semibold">Your tasks</h2>
      {!loading && !error && (
        <CreateTaskForm onCreated={(task) => setTasks((current) => [task, ...current])} />
      )}
      {loading ? (
        <p role="status">Loading tasks…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-600">No tasks yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onUpdated={(updated) => setTasks((current) =>
                current.map((item) => item.id === updated.id ? updated : item)
              )}
              onDeleted={(id) => setTasks((current) => current.filter((item) => item.id !== id))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(fields.get("email")).trim(),
        password: String(fields.get("password")),
      });

      if (error) throw error;
      form.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const buttonStyle = "w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Cadence</h1>
        {!ready ? (
          <p className="mt-4" role="status">Checking your session…</p>
        ) : user ? (
          <div className="mt-6 space-y-4">
            <p>Signed in as <span className="font-medium break-all">{user.email}</span></p>
            <TaskList key={user.id} />
            <button type="button" onClick={signOut} disabled={busy} className={buttonStyle}>
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        ) : (
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <p className="text-sm text-slate-600">Sign in with your existing account.</p>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required disabled={busy}
                className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required disabled={busy}
                className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <button type="submit" disabled={busy} className={buttonStyle}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      </section>
    </main>
  );
}
