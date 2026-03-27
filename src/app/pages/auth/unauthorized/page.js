import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="auth-page">
      <div className="auth-card text-center">
        <span className="hero-kicker">Unauthorized</span>
        <h1>Akses halaman ini butuh login.</h1>
        <p className="auth-copy">
          Silakan login dulu untuk membuka fitur input stock atau update schedule.
        </p>
        <Link href="/pages/auth/login" className="btn btn-warning rounded-pill px-4">
          Ke Halaman Login
        </Link>
      </div>
    </div>
  );
}
