"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function ProtectedPage({ title, description, children }) {
  const router = useRouter();
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/pages/auth/login");
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <div className="content-card">
        <p className="section-tag">Checking session</p>
        <h3>Memvalidasi token login...</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="content-card">
        <p className="section-tag">Protected Page</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </section>
      {children}
    </div>
  );
}
