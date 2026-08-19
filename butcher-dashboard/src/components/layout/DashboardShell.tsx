'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ButcherSessionProvider } from './ButcherSessionProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ButcherSessionProvider>
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
