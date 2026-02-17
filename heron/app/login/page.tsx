import AdminLoginButton from "@/components/AdminLoginButton";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="grid gap-4">
      <h1 className="text-chestnut">Login</h1>
      <p className="text-chestnut-dark">Sign in with Google to upload photos and manage content.</p>
      {error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount" ? (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          Sign-in with Google failed. Try again or use a different account.
        </p>
      ) : null}
      <AdminLoginButton />
    </div>
  );
}
