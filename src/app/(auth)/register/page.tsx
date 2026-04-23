import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

async function register(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();

  if (password.length < 8) {
    redirect(`/register?error=${encodeURIComponent("Password must be at least 8 characters")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }
  redirect(
    `/login?message=${encodeURIComponent(
      "Check your email to confirm, then sign in.",
    )}`,
  );
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Card className="p-8">
      <h2 className="text-h2 font-h2 text-on-surface mb-1">Create account</h2>
      <p className="text-body-sm text-outline mb-6">
        Start tracking your finances in seconds.
      </p>

      {searchParams.error ? (
        <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
          {searchParams.error}
        </div>
      ) : null}

      <form action={register} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" type="text" required />
        </div>
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
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-body-sm text-outline text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
