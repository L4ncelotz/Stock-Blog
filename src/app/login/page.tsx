import { login, signUpOwner } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Owner access only. Public visitors can browse without signing in.
      </p>

      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </button>
      </form>

      {/* Bootstrap owner account — disabled by default. Enable in code to create first owner. */}
      {/*
      <form action={signUpOwner} className="mt-6 border-t border-border pt-6">
        <p className="mb-3 text-xs text-muted-foreground">First-time setup only</p>
        <input name="name" placeholder="Name" className="mb-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm" />
        <button type="submit" className="w-full rounded-md border border-border px-4 py-2 text-sm">
          Create owner account
        </button>
      </form>
      */}
    </div>
  );
}
