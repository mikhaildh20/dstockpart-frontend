"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, getStoredUser, isAuthenticated } from "@/lib/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const parsedUser = getStoredUser();
  const loggedIn = isAuthenticated();

  const publicMenus = [
    { href: "/", label: "Dashboard", icon: "bi-grid" },
    { href: "/pages/auth/login", label: "Login", icon: "bi-box-arrow-in-right", guestOnly: true },
  ];

  const adminMenus = [
    { href: "/pages/stock", label: "Input Stock", icon: "bi-box-seam" },
    { href: "/pages/schedule", label: "Update Schedule", icon: "bi-calendar-check" },
  ];

  const handleLogout = () => {
    clearAuthSession();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="sidebar-panel">
      <div>
        <div className="sidebar-brand">
          <span className="sidebar-badge">DSP</span>
          <div>
            <p className="sidebar-title">DStockPart</p>
            <p className="sidebar-subtitle">Monitoring Dashboard</p>
          </div>
        </div>

        <div className="sidebar-user">
          <p className="sidebar-label">Access</p>
          {parsedUser ? (
            <>
              <h3>{parsedUser.fullname}</h3>
              <p>{parsedUser.position || "Operator"}</p>
            </>
          ) : (
            <>
              <h3>Guest Mode</h3>
              <p>Dashboard can still be viewed without login.</p>
            </>
          )}
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-label">Public Menu</p>
          {publicMenus
            .filter((item) => !(item.guestOnly && loggedIn))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            ))}

          <p className="sidebar-label mt-4">Admin Menu</p>
          {adminMenus.map((item) => (
            <Link
              key={item.href}
              href={loggedIn ? item.href : "/pages/auth/login"}
              className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
              {!loggedIn && <small className="sidebar-hint">Login</small>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        {loggedIn ? (
          <button type="button" className="btn btn-light w-100 rounded-pill" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <Link href="/pages/auth/login" className="btn btn-warning w-100 rounded-pill">
            Login Admin
          </Link>
        )}
      </div>
    </aside>
  );
}
