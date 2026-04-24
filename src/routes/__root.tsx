import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1
          className="text-8xl font-black tracking-tight bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          404
        </h1>
        <h2 className="mt-4 text-2xl font-black tracking-tight">Scene not found</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          This reel doesn't exist in our archive.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition-all hover:shadow-[var(--shadow-glow-orange)]"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SB Movie Club" },
      {
        name: "description",
        content:
          "A private movie club. Track what we've watched together, discover what's next.",
      },
      { property: "og:title", content: "SB Movie Club" },
      {
        property: "og:description",
        content: "A private movie club. Track what we've watched together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "SB Movie Club" },
      { name: "description", content: "SB Movie Club is a private web app for members to track and rate movies watched together." },
      { property: "og:description", content: "SB Movie Club is a private web app for members to track and rate movies watched together." },
      { name: "twitter:description", content: "SB Movie Club is a private web app for members to track and rate movies watched together." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/43d41878-2c8e-4f1f-907d-cfe1fe165cd8/id-preview-f507b32c--9ffcafe6-078d-4b29-af11-74622bf6a84a.lovable.app-1777055803674.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/43d41878-2c8e-4f1f-907d-cfe1fe165cd8/id-preview-f507b32c--9ffcafe6-078d-4b29-af11-74622bf6a84a.lovable.app-1777055803674.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Outlet />
      </AuthGuard>
    </AuthProvider>
  );
}
