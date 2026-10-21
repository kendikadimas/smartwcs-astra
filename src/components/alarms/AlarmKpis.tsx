'use client';

import React from 'react';
import { AlarmMetrics } from '@/types/alarm';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Gauge,
  Flame,
} from 'lucide-react';

interface AlarmKpisProps {
  metrics: AlarmMetrics;
  onSelectTab?: (tab: 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED') => void;
}

export function AlarmKpis({ metrics, onSelectTab }: AlarmKpisProps) {
  const cards = [
    {
      title: 'Active Critical Alarms',
      value: metrics.activeCritical,
      subtext: `${metrics.activeCritical} requires immediate intervention`,
      theme: 'theme-rose',
      icon: AlertOctagon,
      pulse: metrics.activeCritical > 0,
      badge: 'URGENT',
      tabKey: 'ACTIVE' as const,
    },
    {
      title: 'Active Warnings',
      value: metrics.activeWarnings,
      subtext: 'Operational advisory & caution',
      theme: 'theme-orange',
      icon: AlertTriangle,
      badge: 'MONITOR',
      tabKey: 'ACTIVE' as const,
    },
    {
      title: 'Acknowledged (In Progress)',
      value: metrics.acknowledged,
      subtext: 'Assigned to technicians on-site',
      theme: 'theme-blue',
      icon: Clock,
      badge: 'ISA-18.2',
      tabKey: 'ACKNOWLEDGED' as const,
    },
    {
      title: 'Cleared Today',
      value: metrics.clearedToday,
      subtext: 'Successfully resolved & restored',
      theme: 'theme-green',
      icon: CheckCircle2,
      badge: 'RESOLVED',
      tabKey: 'CLEARED' as const,
    },
    {
      title: 'Avg. MTTA (Ack Latency)',
      value: `${metrics.mttaSec}s`,
      subtext: `Target < 60s · MTTR ~${metrics.mttrMin}m`,
      theme: 'theme-teal',
      icon: Gauge,
      badge: 'SLA MET',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: '12px',
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`gradient-card ${card.theme}`}
            style={{
              cursor: card.tabKey && onSelectTab ? 'pointer' : 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => {
              if (card.tabKey && onSelectTab) {
                onSelectTab(card.tabKey);
              }
            }}
            title={card.tabKey ? `Filter by ${card.tabKey}` : undefined}
          >
            {/* Background Decorative Circles */}
            <div className="card-decor-circles" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="115" fill="white" fillOpacity="0.08" />
                <circle cx="130" cy="130" r="80" fill="white" fillOpacity="0.12" />
                <circle cx="130" cy="130" r="48" fill="white" fillOpacity="0.16" />
              </svg>
            </div>

            {/* Top Bar */}
            <div
              className="gradient-card-header"
              style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '6px' }}
            >
              <div
                className="gradient-card-icon-wrap"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} />
                {card.pulse && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      boxShadow: '0 0 0 2px #ffffff, 0 0 8px #ef4444',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                )}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: 'rgba(255, 255, 255, 0.95)',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {card.pulse && <Flame size={10} style={{ color: '#fee2e2' }} />}
                {card.badge}
              </span>
            </div>

            {/* Card Body */}
            <div className="gradient-card-body">
              <div className="gradient-card-title">{card.title}</div>
              <div className="gradient-card-value-row">
                <div
                  className="gradient-card-value"
                  style={{
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                  }}
                >
                  {card.value}
                </div>
              </div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
