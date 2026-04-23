import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <Card className="p-8">
      <h2 className="text-h2 font-h2 text-on-surface mb-1">Welcome back</h2>
      <p className="text-body-sm text-outline mb-6">
        Sign in to continue to your dashboard.
      </p>

      {searchParams.message ? (
        <div className="mb-4 p-3 rounded-lg bg-secondary-container text-on-secondary-container text-body-sm">
          {searchParams.message}
        </div>
      ) : null}
      {searchParams.error ? (
        <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
          {searchParams.error}
        </div>
      ) : null}

      <form action={login} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-body-sm text-outline text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Register
        </Link>
      </p>
    </Card>
  );
}
