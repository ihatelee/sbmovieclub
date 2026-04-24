import { createFileRoute } from "@tanstack/react-router";
import { Film, Plus, Settings, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { movies } from "@/lib/mock-movies";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SB Movie Club" },
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
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
              Control room
            </span>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Admin</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Manage screenings, members, and club settings.
            </p>
          </div>

          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]">
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
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-black tracking-tight">Screenings</h2>
            <span className="text-xs font-bold text-muted-foreground">
              {movies.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Director</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Picked by</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-secondary/60"
                  >
                    <td className="px-6 py-3 font-bold">{m.title}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.director}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.year}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.pickedBy}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {m.rating?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="font-bold text-primary hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Admin actions are inactive until Lovable Cloud is connected.
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs font-medium text-muted-foreground">{hint}</div>}
    </div>
  );
}
