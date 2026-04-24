import { createFileRoute } from "@tanstack/react-router";
import { Film, Plus, Settings, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { movies } from "@/lib/mock-movies";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Reel Society" },
      { name: "description", content: "Manage screenings and members." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
              Control room
            </span>
            <h1 className="mt-2 font-display text-4xl">Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage screenings, members, and club settings.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-[var(--shadow-glow)]">
            <Plus className="h-4 w-4" /> Add movie
          </button>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Stat icon={Film} label="Movies watched" value={movies.length.toString()} />
          <Stat icon={Users} label="Active members" value="—" hint="Connect Cloud" />
          <Stat icon={Settings} label="Avg. rating" value="7.8" />
        </div>

        {/* Screenings table */}
        <div className="mt-12 overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h2 className="font-display text-lg">Screenings</h2>
            <span className="text-xs text-muted-foreground">{movies.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Director</th>
                  <th className="px-6 py-3 font-medium">Year</th>
                  <th className="px-6 py-3 font-medium">Picked by</th>
                  <th className="px-6 py-3 font-medium">Rating</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-6 py-3 font-medium">{m.title}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.director}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.year}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.pickedBy}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {m.rating?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-primary hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Admin actions are inactive until Supabase is connected.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-3 font-display text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
