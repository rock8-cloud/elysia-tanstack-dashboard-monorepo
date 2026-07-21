import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { authClient } from "#/lib/auth-client";

import type { FormEvent } from "react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context }) => {
    let session = context.session;
    if (!session && typeof window !== "undefined") {
      const result = await authClient.getSession();
      session = result.data;
    }
    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name, email, password });

    setIsPending(false);

    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      return;
    }

    await router.invalidate();
    if (search.redirect?.startsWith("/")) {
      router.history.push(search.redirect);
    } else {
      navigate({ to: "/" });
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "sign-in" ? "Sign in" : "Create an account"}</CardTitle>
          <CardDescription>
            {mode === "sign-in"
              ? "Enter your credentials to access your todos."
              : "A few details and you are ready to go."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            {mode === "sign-up" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <span>
              No account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => {
                  setMode("sign-up");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => {
                  setMode("sign-in");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
