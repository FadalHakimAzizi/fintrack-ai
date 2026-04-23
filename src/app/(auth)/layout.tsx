export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-h1 text-h1 text-primary tracking-tight">FinTrack AI</h1>
          <p className="text-body-sm text-outline mt-2">
            Track income, expenses, and receipts in one place.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
