"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { updateProfile } from "@/app/(dashboard)/settings/actions";

export function ProfileForm({
  defaultFullName,
  defaultCurrency,
  email,
}: {
  defaultFullName: string;
  defaultCurrency: string;
  email: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const r = await updateProfile(formData);
    setSubmitting(false);
    if (r.ok) setSuccess(true);
    else setError(r.error);
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {error ? (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="flex items-center gap-2 rounded-lg bg-secondary-container p-3 text-body-sm text-on-secondary-container">
          <Icon name="check_circle" filled />
          Profil tersimpan.
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} readOnly disabled />
        <p className="text-body-sm text-outline mt-1">
          Email dikelola oleh sistem autentikasi. Hubungi dukungan untuk mengubahnya.
        </p>
      </div>
      <div>
        <Label htmlFor="full_name">Nama Lengkap</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={defaultFullName}
          maxLength={120}
        />
      </div>
      <div>
        <Label htmlFor="currency">Mata Uang Default</Label>
        <Input
          id="currency"
          name="currency"
          type="text"
          defaultValue={defaultCurrency}
          maxLength={3}
          className="uppercase"
        />
        <p className="text-body-sm text-outline mt-1">
          Kode ISO 3 huruf (IDR, USD, SGD, EUR, …).
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </div>
    </form>
  );
}
