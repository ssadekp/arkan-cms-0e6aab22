import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Lam7et Khair" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for the reset link");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen hero-gradient grid place-items-center px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1">
          {mode === "signin" ? "Sign in" : "Reset password"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin"
            ? "Admin & editor access. Accounts are created by an administrator."
            : "Enter your email and we'll send you a link to reset your password."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode === "signin" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "signin" ? "Sign in" : "Send reset link"}
          </Button>
        </form>

        <div className="mt-4 text-xs text-center">
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-primary hover:underline"
            >
              Forgot your password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Need access? Contact your administrator.
        </p>
      </Card>
    </div>
  );
}
