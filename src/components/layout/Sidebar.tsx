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
} from 'lucide-react';

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

  const isItemActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/overview';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/logowcs.png"
            alt="SYNTRA Smart WCS Platform"
            width={170}
            height={42}
            priority
            style={{ width: 'auto', height: '34px', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Status & User */}
      <div className="sidebar-footer">
        {/* System Status Box */}
        <div className="system-status-box">
          <div className="status-dot-row">
            <span className="status-dot" />
            <span>System online</span>
          </div>
          <div className="status-meta">Demo environment · v2.4.0</div>
          <div className="status-meta">Updated 10:24:15 WIB</div>
        </div>

        {/* User Profile */}
        <div className="user-profile-row">
          <div className="user-avatar">BS</div>
          <div className="user-info">
            <div className="user-name">Budi Santoso</div>
            <div className="user-role">Operations supervisor</div>
          </div>
          <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
