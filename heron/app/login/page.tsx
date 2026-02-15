import AdminLoginButton from "@/components/AdminLoginButton";

export default function LoginPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-chestnut">Login</h1>
      <p className="text-chestnut-dark">Sign in with Google to upload photos and manage content.</p>
      <AdminLoginButton />
    </div>
  );
}
