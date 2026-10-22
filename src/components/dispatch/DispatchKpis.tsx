'use client';

import React from 'react';
import { DispatchMetrics } from '@/types/dispatch';
import {
  Send,
  Clock,
  Gauge,
  Zap,
  Bot,
  Activity,
} from 'lucide-react';

interface DispatchKpisProps {
  metrics: DispatchMetrics;
  isEngineActive: boolean;
}

export function DispatchKpis({ metrics, isEngineActive }: DispatchKpisProps) {
  const cards = [
    {
      title: 'Active Missions',
      value: metrics.activeMissions,
      subtext: '4 executing · 2 starting',
      theme: 'theme-blue',
      icon: Send,
    },
    {
      title: 'Dispatch Queue',
      value: metrics.queuedTasks,
      subtext: '2 high-prio · 2 standard',
      theme: 'theme-orange',
      icon: Clock,
    },
    {
      title: 'Fleet Availability',
      value: `${metrics.fleetReadyCount} / ${metrics.fleetTotalCount}`,
      subtext: `${Math.round((metrics.fleetReadyCount / metrics.fleetTotalCount) * 100)}% online & ready`,
      theme: 'theme-teal',
      icon: Bot,
    },
    {
      title: 'Dispatch Latency',
      value: `${metrics.avgDispatchLatencySec}s`,
      subtext: 'Target < 60s · SLA optimal',
      theme: 'theme-purple',
      icon: Zap,
    },
    {
      title: 'Auto-Dispatch Engine',
      value: isEngineActive ? `${metrics.autoDispatchRate}%` : 'PAUSED',
      subtext: isEngineActive ? 'Continuous auto-matching' : 'Manual dispatch only',
      theme: isEngineActive ? 'theme-green' : 'theme-rose',
      icon: Activity,
    },
  ];

  return (
    <div className="kpi-grid-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className={`gradient-card ${card.theme}`}>
            {/* Background Decorative Concentric Circles */}
            <div className="card-decor-circles" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="115" fill="white" fillOpacity="0.08" />
                <circle cx="130" cy="130" r="80" fill="white" fillOpacity="0.12" />
                <circle cx="130" cy="130" r="48" fill="white" fillOpacity="0.16" />
              </svg>
            </div>

            {/* Top Bar: Icon */}
            <div className="gradient-card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '6px' }}>
              <div className="gradient-card-icon-wrap">
                <Icon size={16} />
              </div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '1.5px 7px',
                  borderRadius: '12px',
                }}
              >
                LIVE
              </span>
            </div>

            {/* Card Body */}
            <div className="gradient-card-body">
              <div className="gradient-card-title">{card.title}</div>
              <div className="gradient-card-value-row">
                <div className="gradient-card-value" style={{ fontSize: '24px' }}>{card.value}</div>
              </div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
