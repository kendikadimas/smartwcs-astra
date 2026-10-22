'use client';

import React from 'react';
import { SettingsTabKey } from '@/types/settings';
import {
  Building2,
  Bot,
  ShieldAlert,
  Database,
  Cpu,
} from 'lucide-react';

interface SettingsNavTabsProps {
  activeTab: SettingsTabKey;
  onSelectTab: (tab: SettingsTabKey) => void;
}

export function SettingsNavTabs({
  activeTab,
  onSelectTab,
}: SettingsNavTabsProps) {
  const tabs: { key: SettingsTabKey; label: string; icon: React.ElementType; desc: string }[] = [
    {
      key: 'general',
      label: 'General & Facility',
      icon: Building2,
      desc: 'Plant site, timezone & locale',
    },
    {
      key: 'dispatch',
      label: 'Dispatching & Fleet',
      icon: Bot,
      desc: 'Battery thresholds & retry limits',
    },
    {
      key: 'safety',
      label: 'Safety & Alarm Rules',
      icon: ShieldAlert,
      desc: 'E-Stop interlocks & sirens',
    },
    {
      key: 'retention',
      label: 'Data Retention & Logs',
      icon: Database,
      desc: 'Pose logs, integration & audit',
    },
    {
      key: 'diagnostics',
      label: 'Diagnostics & Runtime',
      icon: Cpu,
      desc: 'Worker, Postgres & WebSockets',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        borderRadius: '8px 8px 0 0',
        overflowX: 'auto',
        padding: '0 8px',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              borderBottom: isActive ? '2px solid #0284c7' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: isActive ? '#0284c7' : '#64748b',
              fontWeight: isActive ? 700 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={16} />
            <div style={{ textAlign: 'left' }}>
              <div>{tab.label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
