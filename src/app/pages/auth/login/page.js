"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import fetchData from "@/lib/fetch";
import { saveAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetchData(
      "/api/auth/login",
      form,
      "POST"
    );

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
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <span className="hero-kicker">Admin Login</span>
          <h1>Masuk untuk kelola stock dan schedule.</h1>
          <p className="auth-copy">
            Dashboard monitoring tetap public. Login dipakai khusus untuk area
            operasional yang membutuhkan otorisasi.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              placeholder="Masukkan username"
              className="form-control form-control-lg rounded-pill"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              className="form-control form-control-lg rounded-pill"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </div>

          {message && <div className="alert alert-danger py-2">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-dark w-100 rounded-pill py-3"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
