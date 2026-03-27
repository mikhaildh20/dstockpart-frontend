import ProtectedPage from "@/component/layout/ProtectedPage";

export default function SchedulePage() {
  return (
    <ProtectedPage
      title="Update Schedule"
      description="Halaman template untuk update schedule produksi. Tinggal dilanjutkan ke form edit, approval, dan histori perubahan."
    >
      <section className="content-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <p className="section-tag">Template Board</p>
              <h3>Planning area</h3>
            </div>
          </div>
          <div className="schedule-list">
            <div className="schedule-item">
              <strong>Line A</strong>
              <span>08:00 - 12:00</span>
            </div>
            <div className="schedule-item">
              <strong>Line B</strong>
              <span>13:00 - 17:00</span>
            </div>
            <div className="schedule-item">
              <strong>Line C</strong>
              <span>Night Shift</span>
            </div>
          </div>
        </article>

        <article className="content-card accent-card">
          <p className="section-tag">Access Rule</p>
          <h3>Login required</h3>
          <p>
            Tanpa token JWT, user otomatis diarahkan ke halaman login admin.
          </p>
        </article>
      </section>
    </ProtectedPage>
  );
}
