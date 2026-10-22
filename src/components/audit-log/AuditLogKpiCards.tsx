'use client';

import React from 'react';
import { AuditMetrics } from '@/types/auditLog';
import { FileClock, AlertTriangle, Key, ShieldCheck, ChevronRight } from 'lucide-react';

interface AuditLogKpiCardsProps {
  metrics: AuditMetrics;
}

export function AuditLogKpiCards({ metrics }: AuditLogKpiCardsProps) {
  const cards = [
    {
      title: 'Audit Events Logged Today',
      value: `${metrics.totalEventsToday}`,
      subtext: 'Immutable PostgreSQL transaction logs',
      theme: 'theme-blue',
      icon: FileClock,
      tag: 'IMMUTABLE TRAIL',
    },
    {
      title: 'Supervisor Overrides',
      value: `${metrics.criticalOverrides}`,
      subtext: 'Priority bumps & mission aborts',
      theme: 'theme-orange',
      icon: AlertTriangle,
      tag: 'MANUAL ACTION',
    },
    {
      title: 'Security & Config Updates',
      value: `${metrics.securityMutations}`,
      subtext: 'API keys & threshold modifications',
      theme: 'theme-purple',
      icon: Key,
      tag: 'ADMIN AUDITED',
    },
    {
      title: 'Action Success Rate',
      value: `${metrics.successRate}%`,
      subtext: '0 unauthorized attempts blocked',
      theme: 'theme-green',
      icon: ShieldCheck,
      tag: 'COMPLIANT',
    },
  ];

  return (
    <div className="kpi-grid-4" style={{ marginBottom: '18px' }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className={`gradient-card ${card.theme}`}>
            {/* Concentric Circles Background Decoration */}
            <div className="card-decor-circles" aria-hidden="true">
              <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="130" cy="130" r="115" fill="white" fillOpacity="0.08" />
                <circle cx="130" cy="130" r="80" fill="white" fillOpacity="0.12" />
                <circle cx="130" cy="130" r="48" fill="white" fillOpacity="0.16" />
              </svg>
            </div>

            <div className="gradient-card-header">
              <div className="gradient-card-icon-wrap">
                <Icon size={17} />
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {card.tag}
              </span>
            </div>

            <div className="gradient-card-body">
              <div className="gradient-card-title">{card.title}</div>
              <div className="gradient-card-value">{card.value}</div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
