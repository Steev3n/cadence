"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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
