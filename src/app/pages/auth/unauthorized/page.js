"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="bg-white border rounded-3 p-4 w-100 text-center"
        style={{ maxWidth: 400 }}
      >
        {/* Icon */}
        <div
          className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
          style={{
            width: 48,
            height: 48,
            background: "#faeeda",
            color: "#854f0b",
          }}
        >
          <i className="bi bi-person-lock" style={{ fontSize: 20 }} />
        </div>

        {/* Label */}
        <p
          className="text-uppercase fw-medium mb-1"
          style={{ fontSize: 10, letterSpacing: "0.6px", color: "#b0b0b0" }}
        >
          Unauthorized
        </p>

        {/* Title */}
        <h5 className="fw-medium mb-2" style={{ fontSize: 18 }}>
          Akses Ditolak
        </h5>

        {/* Description */}
        <p className="text-secondary mb-4" style={{ fontSize: 13 }}>
          Silakan login dulu untuk membuka fitur input stock atau update
          schedule.
        </p>

        {/* CTA */}
        <button
          type="button"
          className="btn w-100 d-flex align-items-center justify-content-center gap-2"
          style={{
            height: 38,
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            background: "#faeeda",
            color: "#854f0b",
            border: "1px solid #fac775",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fac775")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#faeeda")}
          onClick={() => router.push("/pages/auth/login")}
        >
          <i className="bi bi-box-arrow-in-right" style={{ fontSize: 15 }} />
          Ke Halaman Login
        </button>

        {/* Back to dashboard */}
        <p className="text-secondary mb-0 mt-3" style={{ fontSize: 12 }}>
          Atau kembali ke{" "}
          <a
            href="/"
            className="text-decoration-none fw-medium"
            style={{ color: "#185fa5" }}
          >
            Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}