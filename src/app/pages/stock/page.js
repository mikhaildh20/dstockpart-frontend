import ProtectedPage from "@/component/layout/ProtectedPage";

export default function StockPage() {
  return (
    <ProtectedPage
      title="Input Stock"
      description="Halaman template untuk input stock. Nanti tinggal kamu sambungkan ke form create, tabel item, dan endpoint backend final."
    >
      <section className="content-grid">
        <article className="content-card">
          <div className="card-heading">
            <div>
              <p className="section-tag">Template Form</p>
              <h3>Struktur input stock</h3>
            </div>
          </div>
          <div className="placeholder-grid">
            <div className="placeholder-box">Part Code</div>
            <div className="placeholder-box">Part Name</div>
            <div className="placeholder-box">Quantity</div>
            <div className="placeholder-box">Section</div>
          </div>
        </article>

        <article className="content-card accent-card">
          <p className="section-tag">Next Step</p>
          <h3>Backend protection ready</h3>
          <p>
            Endpoint login dan validasi token sudah disiapkan untuk area admin.
          </p>
        </article>
      </section>
    </ProtectedPage>
  );
}
