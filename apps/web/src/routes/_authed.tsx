import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";

import { AppSidebar } from "#/components/app-sidebar";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "#/components/ui/sidebar";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/_authed")({
  // This subtree is a personal dashboard behind auth — nothing to gain from
  // SSR, and skipping it lets loaders fetch from the API with cookies.
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    let session = context.session;

    // On split production hosts the API session cookie belongs to the API
    // domain, so the browser must verify it directly after this client-only
    // subtree loads. Local development can still use the SSR session.
    if (!session && typeof window !== "undefined") {
      const result = await authClient.getSession();
      session = result.data;
    }

    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const navigate = Route.useNavigate();

  async function handleSignOut() {
    await authClient.signOut();
    await router.invalidate();
    navigate({ to: "/login" });
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium">Todo workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </header>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
