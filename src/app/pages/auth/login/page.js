"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { saveAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetchData("auth/login", form, "POST");

    if (!res.error && res.token) {
      saveAuthSession({ token: res.token, user: res.user });
      router.push("/pages/stock");
      router.refresh();
    } else {
      setMessage(res.message || "Login gagal");
    }

    setLoading(false);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
    >
      <div
        className="bg-white border rounded-3 p-4 w-100"
        style={{ maxWidth: 400 }}
      >
        {/* Header */}
        <div className="mb-4">
          {/* Company logo */}
          <img
            src="/images/logoKoito.png"
            alt="Koito Logo"
            className="mb-3"
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />

          <p
            className="mb-1 text-uppercase fw-medium"
            style={{ fontSize: 10, letterSpacing: "0.6px", color: "#b0b0b0" }}
          >
            Authorize Login
          </p>
          <h5 className="fw-medium mb-1" style={{ fontSize: 18 }}>
            Access the Stock Part Dashboard
          </h5>
          <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
            The monitoring dashboard remains public. Login is required for operational areas that need authorization.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label
              className="fw-medium mb-1 d-block"
              style={{ fontSize: 13 }}
            >
              Username
            </label>
            <input
              type="text"
              placeholder="Masukkan username"
              className="form-control rounded-2"
              style={{ fontSize: 13, height: 38 }}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label
              className="fw-medium mb-1 d-block"
              style={{ fontSize: 13 }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Masukkan password"
              className="form-control rounded-2"
              style={{ fontSize: 13, height: 38 }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {message && (
            <div
              className="rounded-2 px-3 py-2 mb-3 d-flex align-items-center gap-2"
              style={{
                fontSize: 13,
                background: "#fff5f5",
                border: "0.5px solid #f5c6c6",
                color: "#a32d2d",
              }}
            >
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" style={{ fontSize: 14 }} />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              height: 38,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              background: loading ? "#b5d4f4" : "#185fa5",
              color: "#fff",
              border: "none",
              transition: "background 0.15s",
            }}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  style={{ width: 14, height: 14, borderWidth: 2 }}
                />
                Signing in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right" style={{ fontSize: 15 }} />
                Login
              </>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p
          className="text-center text-secondary mb-0 mt-3"
          style={{ fontSize: 12 }}
        >
          Back to{" "}
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
