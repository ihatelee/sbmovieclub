import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SB Movie Club" },
      { name: "description", content: "Sign in or join the private movie club." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Visual side */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          aria-hidden
          className="absolute -left-20 top-1/4 h-96 w-96 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--gradient-brand)" }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
              style={{ background: "var(--gradient-brand)" }}
              aria-hidden
            >
              🎬
            </div>
            <span className="text-xl font-black tracking-tight">
              SB <span className="text-primary">Movie</span> Club
            </span>
          </Link>

          <div className="max-w-md">
            <p className="text-4xl font-black leading-[1.05] tracking-tight">
              Movies are better{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                with friends.
              </span>
            </p>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Track every pick. Rate every screening. Argue about every ending.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                style={{ background: "var(--gradient-brand)" }}
                aria-hidden
              >
                🎬
              </div>
              <span className="text-xl font-black">
                SB <span className="text-primary">Movie</span> Club
              </span>
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="text-4xl font-black tracking-tight">
              {mode === "signin" ? "Welcome back" : "Join the club"}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your member account."
                : "Create an account to start tracking screenings."}
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {mode === "signup" && (
              <Field label="First name">
                <input type="text" required placeholder="Alex" className="auth-input" />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                placeholder="you@sbmovie.club"
                className="auth-input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="auth-input"
              />
            </Field>

            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-black text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Connect Lovable Cloud to enable real authentication.
          </p>
        </div>
      </div>

      <style>{`
        .auth-input {
          width: 100%;
          background-color: var(--input);
          border: 1px solid var(--border);
          color: var(--foreground);
          border-radius: 9999px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-input:focus {
          outline: none;
          border-color: var(--ring);
          box-shadow: 0 0 0 3px rgba(255,107,53,0.25);
        }
        .auth-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-xs font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
