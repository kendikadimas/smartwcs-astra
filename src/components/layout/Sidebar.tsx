'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Send,
  Layers,
  Map,
  Bell,
  BarChart3,
  Database,
  Cable,
  Sliders,
  Users,
  FileClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface NavItemDef {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

const navGroups: NavGroupDef[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Operations Overview', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Task Management', href: '/tasks', icon: ClipboardList },
      { label: 'Dispatch & Execution', href: '/dispatch', icon: Send },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { label: 'Equipment & Resources', href: '/equipment', icon: Layers },
      { label: 'Warehouse Map', href: '/warehouse-map', icon: Map },
      { label: 'Alarms & Events', href: '/alarms', icon: Bell },
      { label: 'KPI & Reports', href: '/kpi', icon: BarChart3 },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Master Data', href: '/master-data', icon: Database },
      { label: 'Integrations', href: '/integrations', icon: Cable },
      { label: 'System Settings', href: '/settings', icon: Sliders },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Users & Roles', href: '/users', icon: Users },
      { label: 'Audit Log', href: '/audit-log', icon: FileClock },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    isOpenMobile,
    closeMobile,
    isCollapsed,
    toggleCollapsed,
    isMobile,
  } = useSidebar();

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/overview';
    }
    return pathname.startsWith(href);
  };

  const isMini = isCollapsed && !isMobile;

  return (
    <aside
      className={`sidebar ${isMini ? 'collapsed' : ''} ${isOpenMobile ? 'mobile-open' : ''}`}
      aria-label="Main Navigation"
    >
      {/* Brand Logo Header - Centered Horizontally with Smooth Cross-fade */}
      <div className="sidebar-logo">
        <Link
          href="/"
          className="sidebar-logo-link"
          onClick={() => {
            if (isMobile) closeMobile();
          }}
          title="SYNTRA Smart WCS Platform"
        >
          {/* Full Centered Logo */}
          <div className="logo-full-wrap">
            <Image
              src="/images/logowcs.png"
              alt="SYNTRA Smart WCS Platform"
              width={220}
              height={56}
              priority
              style={{
                width: 'auto',
                height: '46px',
                maxWidth: '190px',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Mini Emblem Symbol (Without Text) */}
          <div className="logo-symbol-wrapper" title="SYNTRA Smart WCS Platform">
            <Image
              src="/images/wcslogo.png"
              alt="SYNTRA WCS"
              width={42}
              height={42}
              priority
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
              }}
            />
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          className="sidebar-close-mobile-btn"
          onClick={closeMobile}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Groups with smooth label transitions */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-group-section">
            <div className="nav-group-title">{group.title}</div>
            <div className="nav-group-divider" />
            {group.items.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                  title={isMini ? item.label : undefined}
                  onClick={() => {
                    if (isMobile) closeMobile();
                  }}
                >
                  <Icon className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Status & User */}
      <div className="sidebar-footer">
        {/* Desktop Collapse / Expand Toggle Button */}
        {!isMobile && (
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="collapse-icon">
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
            <span className="collapse-text">Collapse Sidebar</span>
          </button>
        )}

        {/* System Status Box */}
        <div
          className="system-status-box"
          title={isMini ? 'System online · Demo environment v2.4.0 · Updated 10:24:15 WIB' : undefined}
        >
          <div className="status-dot-row">
            <span className="status-dot" />
            <span className="status-title">System online</span>
          </div>
          <div className="status-meta">Demo environment · v2.4.0</div>
          <div className="status-meta">Updated 10:24:15 WIB</div>
        </div>

        {/* User Profile */}
        <div
          className="user-profile-row"
          title={isMini ? 'Budi Santoso · Operations supervisor' : undefined}
        >
          <div className="user-avatar">BS</div>
          <div className="user-info">
            <div className="user-name">Budi Santoso</div>
            <div className="user-role">Operations supervisor</div>
          </div>
          <ChevronDown className="user-chevron" size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
