'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ButcherSessionProvider, useButcherSession } from './ButcherSessionProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { useButcherLiveSocket } from '@/hooks/useButcherLiveSocket';

function LiveSocketBridge() {
  const { butcher } = useButcherSession();
  useButcherLiveSocket(butcher?.id ?? null);
  return null;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ButcherSessionProvider>
        <LiveSocketBridge />
        <div className="flex min-h-screen bg-canvas">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ButcherSessionProvider>
    </ToastProvider>
  );
}
