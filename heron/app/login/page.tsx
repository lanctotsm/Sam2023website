import AdminLoginButton from "@/components/AdminLoginButton";

export default function LoginPage() {
  return (
    <div className="stack">
      <h1>Login</h1>
      <p>Sign in with Google to upload photos and manage content.</p>
      <AdminLoginButton />
    </div>
  );
}
