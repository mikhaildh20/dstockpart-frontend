"use client";

import { useRouter } from "next/navigation";

const metrics = [
  { label: "Stock Active", value: "128", note: "Item monitored today" },
  { label: "Low Stock", value: "14", note: "Need restock follow-up" },
  { label: "Schedule Running", value: "07", note: "Production line active" },
];

const activities = [
  { title: "Line A schedule revised", time: "08:15", status: "Updated" },
  { title: "Part P-204 stock received", time: "09:20", status: "Inbound" },
  { title: "Model X demand spike", time: "10:05", status: "Alert" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div>
          <span className="hero-kicker">Public Dashboard</span>
          <h1>Monitoring stock dan schedule tetap bisa dilihat tanpa login.</h1>
          <p>
            Login dipakai khusus untuk input stock dan update schedule. Template ini
            sudah siap dipakai sebagai pondasi halaman operasional.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-warning rounded-pill px-4"
            onClick={() => router.push("/pages/auth/login")}
          >
            Login Admin
          </button>
          <button
            type="button"
            className="btn btn-outline-light rounded-pill px-4"
            onClick={() => router.push("/pages/stock")}
          >
            Cek Menu Admin
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((item) => (
          <article key={item.label} className="metric-card">
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <span>{item.note}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <p className="section-tag">Live Activity</p>
              <h3>Recent monitoring feed</h3>
            </div>
            <span className="status-pill">Realtime Template</span>
          </div>

          <div className="activity-list">
            {activities.map((item) => (
              <div key={`${item.title}-${item.time}`} className="activity-item">
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.time}</p>
                </div>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card accent-card">
          <p className="section-tag">Admin Access</p>
          <h3>Hak akses login</h3>
          <ul className="feature-list">
            <li>Input stock baru</li>
            <li>Update schedule produksi</li>
            <li>Validasi session dengan JWT token</li>
            <li>Template sidebar untuk public dan admin menu</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
