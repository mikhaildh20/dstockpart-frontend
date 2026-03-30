"use client";

import { useCallback, useState } from "react";
import Sidebar from "@/component/layout/Sidebar";

export default function AppShell({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  }, []);

  return (
    <div
      className={`app-shell ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      } ${isSidebarOpen ? "sidebar-open" : ""}`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={closeSidebar}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <main className="app-content">
        <header className="content-header">
          <div className="content-toolbar">
            <button
              type="button"
              className="sidebar-toggle-btn mobile-only"
              onClick={openSidebar}
              aria-label="Open sidebar"
            >
              <i className="bi bi-list" />
            </button>
          </div>

          <div className="content-header-copy text-start">
            <h3 className="fw-medium mb-1">Stock Part</h3>
            <h4 className="fw-normal mb-0 text-secondary">Monitoring Dashboard</h4>
          </div>
        </header>

        <section className="content-children">{children}</section>

        <footer className="content-footer d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
          {/* Left */}
          <div className="text-muted small">
            © {new Date().getFullYear()} <strong>Stock Part Dashboard</strong>. All rights reserved.
          </div>

          {/* Right */}
          <div className="text-muted small text-md-end">
            Version <strong>1.0.0</strong> · Developed by Mikhail — Intern, Astra Polytechnic
          </div>
        </footer>
      </main>
    </div>
  );
}
