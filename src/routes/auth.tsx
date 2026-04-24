import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Film } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Reel Society" },
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
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[image:var(--gradient-gold)] opacity-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, oklch(0.14 0.012 250 / 0.4), oklch(0.14 0.012 250 / 0.95)), url('https://picsum.photos/seed/cinema/1200/1600')",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-gold-foreground">
              <Film className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl">Reel Society</span>
          </Link>

          <div className="max-w-md">
            <p className="font-display text-3xl leading-tight">
              "We don't make movies to make money, we make money to make more movies."
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
              — Walt Disney
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-gold)] text-gold-foreground">
                <Film className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl">Reel Society</span>
            </Link>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="font-display text-3xl">
              {mode === "signin" ? "Welcome back" : "Join the club"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your member account."
                : "Create an account to start tracking screenings."}
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: wire to Supabase auth
            }}
          >
            {mode === "signup" && (
              <Field label="First name">
                <input
                  type="text"
                  required
                  placeholder="Ingmar"
                  className="auth-input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                placeholder="you@reelsociety.club"
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
              className="mt-2 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-[var(--shadow-glow)]"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
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
          border-radius: var(--radius);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-input:focus {
          outline: none;
          border-color: var(--ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 20%, transparent);
        }
        .auth-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
