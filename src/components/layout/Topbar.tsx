'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronRight, Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface TopbarProps {
  onToggleMobileNav?: () => void;
}

export function Topbar({ onToggleMobileNav }: TopbarProps) {
  const pathname = usePathname();
  const { toggleSidebar, isCollapsed, isMobile } = useSidebar();
  const isOverview = pathname === '/' || pathname === '/overview';
  const isTasks = pathname.startsWith('/tasks');

  // Breadcrumb determination
  let rootBreadcrumb = 'SYNTRA Smart WCS';
  let currentBreadcrumb = 'Task Management';

  if (isOverview) {
    rootBreadcrumb = 'Smart Warehouse Control System';
    currentBreadcrumb = 'Overview';
  } else if (isTasks) {
    rootBreadcrumb = 'SYNTRA Smart WCS';
    currentBreadcrumb = 'Task Management';
  } else {
    // Other pages
    const raw = pathname.replace('/', '').replace(/-/g, ' ');
    currentBreadcrumb = raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const handleToggle = () => {
    if (onToggleMobileNav) {
      onToggleMobileNav();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button sidebar-toggle-btn"
          onClick={handleToggle}
          aria-label={isMobile ? 'Toggle menu' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
          title={isMobile ? 'Toggle menu' : (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
        >
          <Menu size={18} />
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-root">{rootBreadcrumb}</span>
          <ChevronRight className="breadcrumb-sep" size={13} />
          <span key={currentBreadcrumb} className="breadcrumb-current">{currentBreadcrumb}</span>
        </div>
      </div>

      <div className="topbar-right">
        {isOverview ? (
          // Operations Overview Header Style (as per Screenshot 1)
          <div className="topbar-overview-meta" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="topbar-shift-badge" style={{ fontSize: '12px', color: '#64748b' }}>
              15 Oct 2026 · Shift A · WIB
            </span>
            <span
              className="topbar-snapshot-badge"
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#0f172a',
                paddingLeft: '12px',
                borderLeft: '1px solid #e2e8f0',
              }}
            >
              Snapshot 10:24:15
            </span>
          </div>
        ) : (
          // Task Management Header Style (as per Screenshot 2)
          <>
            <div className="search-input-wrap">
              <Search />
              <input
                type="text"
                placeholder="Search tasks, resources..."
                className="search-input"
              />
              <kbd className="search-kbd">⌘ K</kbd>
            </div>

            <button className="icon-button" aria-label="Notifications">
              <Bell size={16} />
              <span className="badge-counter">3</span>
            </button>

            <div className="clock-info">
              <span className="clock-date">Mon, 16 Jun 2025 · WIB (UTC+7)</span>
              <span className="clock-time">10:24:15</span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
