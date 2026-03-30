"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthSession,
  getStoredUser,
  isAuthenticated,
  subscribeAuthState,
} from "@/lib/auth";
import SweetAlert from "@/component/common/SweetAlert";

export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    parsedUser: null,
    loggedIn: false,
    isReady: false,
  });
  const { parsedUser, loggedIn, isReady } = authState;

  const publicMenus = [
    { href: "/pages/dashboard", label: "Dashboard", icon: "bi-grid" },
    {
      href: "/pages/auth/login",
      label: "Login",
      icon: "bi-box-arrow-in-right",
      guestOnly: true,
    },
  ];

  const adminMenus = [
  { href: "/pages/line", label: "Manage Line", icon: "bi-diagram-3" },
  { href: "/pages/model", label: "Manage Model", icon: "bi-box" },
];

  const handleLogout = async () => {
    const result = await SweetAlert({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "info",
      confirmText: "Yes, logout!",
    });

    if (!result) return;

    clearAuthSession();
    onClose();
    router.push("/pages/dashboard");
    router.refresh();
  };

  const handleNavigate = (href) => {
    onClose();
    router.push(href);
  };

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState({
        parsedUser: getStoredUser(),
        loggedIn: isAuthenticated(),
        isReady: true,
      });
    };

    syncAuthState();

    return subscribeAuthState(syncAuthState);
  }, []);

  const userInitial = parsedUser?.fullname?.charAt(0)?.toUpperCase() || "G";

  // Shared nav button style builder
  const navBtnStyle = (isActive) => ({
    height: 36,
    fontSize: 13,
    gap: 10,
    padding: isCollapsed ? 0 : "0 8px",
    justifyContent: isCollapsed ? "center" : "flex-start",
    background: isActive ? "#e6f1fb" : "transparent",
    color: isActive ? "#185fa5" : undefined,
    transition: "background 0.12s",
  });

  const NavItem = ({ item }) => {
    const isActive = pathname === item.href;
    return (
      <button
        type="button"
        title={item.label}
        onClick={() => handleNavigate(item.href)}
        className={`btn border-0 d-flex align-items-center text-start w-100 rounded-2 ${
          isActive ? "fw-medium" : "text-secondary"
        }`}
        style={navBtnStyle(isActive)}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "#f5f5f4";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = isActive ? "#e6f1fb" : "transparent";
        }}
      >
        <i
          className={`bi ${item.icon} flex-shrink-0`}
          style={{ fontSize: 15, width: 16, textAlign: "center" }}
        />
        {!isCollapsed && <span className="text-truncate">{item.label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className="d-flex flex-column bg-white border-end"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: isCollapsed ? 60 : 220,
          zIndex: 1050,
          overflow: "hidden",
          transition: "width 0.25s ease, transform 0.25s ease",
          // Mobile: slide in/out; Desktop: always visible
          transform: isOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* ── Topbar ── */}
        <div
          className={`d-flex align-items-center border-bottom px-2 flex-shrink-0 ${
            isCollapsed ? "justify-content-center" : ""
          }`}
          style={{ height: 56, gap: 8 }}
        >
          {!isCollapsed && (
            <div className="d-flex align-items-center justify-content-center flex-grow-1 overflow-hidden">
              <img
                src="/images/logoKoito.png"
                alt="Koito Logo"
                className="sidebar-koito-logo flex-shrink-0"
                style={{
                  width: 88,
                  height: 28,
                  objectFit: "contain",
                }}
              />
            </div>
          )}

          {/* Desktop: collapse toggle */}
          <button
            type="button"
            className="btn btn-sm btn-light d-none d-md-flex align-items-center justify-content-center p-0 border-0 flex-shrink-0"
            style={{ width: 28, height: 28, margin: isCollapsed ? "0 auto" : undefined }}
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
          >
            <i
              className={`bi ${isCollapsed ? "bi-layout-sidebar" : "bi-layout-sidebar-reverse"}`}
              style={{ fontSize: 14 }}
            />
          </button>

          {/* Mobile: close */}
          <button
            type="button"
            className="btn btn-sm btn-light d-flex d-md-none align-items-center justify-content-center p-0 border-0 flex-shrink-0"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* ── User section ── */}
        <div
          className={`border-bottom flex-shrink-0 ${
            isCollapsed ? "d-flex justify-content-center py-2" : "px-3 py-2"
          }`}
        >
          {!isCollapsed && (
            <p
              className="mb-1 text-uppercase fw-medium"
              style={{ fontSize: 10, letterSpacing: "0.6px", color: "#b0b0b0" }}
            >
              Access
            </p>
          )}
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle fw-medium flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                fontSize: 12,
                background: "#e6f1fb",
                color: "#185fa5",
              }}
            >
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="mb-0 fw-medium text-truncate" style={{ fontSize: 13 }}>
                  {parsedUser?.fullname ?? "Guest Mode"}
                </p>
                <p className="mb-0 text-secondary text-truncate" style={{ fontSize: 11 }}>
                  {parsedUser
                    ? parsedUser.position || "Operator"
                    : "View-only access"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav
          className="d-flex flex-column flex-grow-1 overflow-auto p-2"
          style={{ gap: 2 }}
        >
          {!isCollapsed && (
            <p
              className="mb-0 text-uppercase fw-medium px-1 pt-1 pb-1"
              style={{ fontSize: 10, letterSpacing: "0.6px", color: "#b0b0b0" }}
            >
              Public Menu
            </p>
          )}

          {publicMenus
            .filter((item) => !(item.guestOnly && (isReady ? loggedIn : false)))
            .map((item) => (
              <NavItem key={item.href} item={item} />
            ))}

          {isReady && loggedIn && (
            <>
              {!isCollapsed && (
                <p
                  className="mb-0 text-uppercase fw-medium px-1 pt-3 pb-1"
                  style={{ fontSize: 10, letterSpacing: "0.6px", color: "#b0b0b0" }}
                >
                  Authorized Menu
                </p>
              )}
              {adminMenus.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="border-top flex-shrink-0 p-2">
          {isReady && loggedIn ? (
            <button
              type="button"
              title="Logout"
              onClick={handleLogout}
              className="btn btn-light d-flex align-items-center justify-content-center gap-2 border"
              style={{
                width: isCollapsed ? 36 : "100%",
                height: 34,
                fontSize: 12,
                margin: isCollapsed ? "0 auto" : undefined,
                borderRadius: isCollapsed ? "50%" : "20px",
              }}
            >
              <i className="bi bi-box-arrow-right flex-shrink-0" style={{ fontSize: 14 }} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          ) : (
            <button
              type="button"
              title="Login Admin"
              onClick={() => handleNavigate("/pages/auth/login")}
              className="btn d-flex align-items-center justify-content-center gap-2"
              style={{
                width: isCollapsed ? 36 : "100%",
                height: 34,
                fontSize: 12,
                margin: isCollapsed ? "0 auto" : undefined,
                borderRadius: isCollapsed ? "50%" : "20px",
                background: "#faeeda",
                color: "#854f0b",
                border: "1px solid #fac775",
              }}
            >
              <i className="bi bi-person-lock flex-shrink-0" style={{ fontSize: 14 }} />
              {!isCollapsed && <span>Login Admin</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
