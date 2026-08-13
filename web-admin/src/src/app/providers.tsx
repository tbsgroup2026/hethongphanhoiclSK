"use client";

import { SessionProvider } from "next-auth/react";
import BrowserNotificationManager from "@/components/browser-notification-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <BrowserNotificationManager />
    </SessionProvider>
  );
}
