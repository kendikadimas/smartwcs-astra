'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-layout">
      {/* Fixed Left Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="main-area">
        {/* Top Header */}
        <Topbar />

        {/* Scrollable Page View */}
        <main className="page-content-wrapper">{children}</main>
      </div>
    </div>
  );
}
