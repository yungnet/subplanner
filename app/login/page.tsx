"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "rate_limited">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace(from);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setStatus("rate_limited");
        setErrorMsg(data.error ?? "Too many attempts. Please wait a moment.");
      } else {
        setStatus("error");
        setErrorMsg("Incorrect password. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-xl shadow-black/5 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🍎</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
              Subplanner
            </h1>
            <p className="text-gray-500 text-sm mt-1">Mrs. Yung&apos;s Sub Plan Generator</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatus("idle"); setErrorMsg(""); }}
                placeholder="Enter password"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full bg-white/70 border border-gray-300/80 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white/90 transition-all"
              />
            </div>

            {/* Error message */}
            {errorMsg && (
              <p className={`text-xs rounded-xl px-4 py-2.5 ${
                status === "rate_limited"
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-rose-50 border border-rose-200 text-rose-700"
              }`}>
                {status === "rate_limited" ? "⏳ " : "⚠ "}{errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading" || status === "rate_limited" || !password.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200/60 hover:from-indigo-600 hover:to-violet-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

// useSearchParams requires Suspense in Next.js App Router
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
