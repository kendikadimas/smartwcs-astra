'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellInner({ children }: AppShellProps) {
  const { isOpenMobile, closeMobile, isCollapsed, isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <div
      className={`app-layout ${isCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}
    >
      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-overlay ${isOpenMobile ? 'active' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="main-area">
        {/* Top Header */}
        <Topbar />

        {/* Scrollable Page View with Smooth Page Transition */}
        <main className="page-content-wrapper">
          <div key={pathname} className="page-transition-wrap">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
