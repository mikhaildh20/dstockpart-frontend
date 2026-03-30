"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/component/layout/AppShell";

export default function RouteLayoutResolver({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/pages/auth");

  if (isAuthPage) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
