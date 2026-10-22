'use client';

import React from 'react';
import { Users, UserCheck, ShieldCheck, KeyRound, ChevronRight } from 'lucide-react';

interface UserKpiCardsProps {
  totalUsers: number;
  activeCount: number;
  rolesCount: number;
}

export function UserKpiCards({
  totalUsers,
  activeCount,
  rolesCount,
}: UserKpiCardsProps) {
  const cards = [
    {
      title: 'Total Provisioned Accounts',
      value: `${totalUsers}`,
      subtext: 'Winteq & Kalana Labs staff',
      theme: 'theme-blue',
      icon: Users,
      tag: 'ALL REGISTERED',
    },
    {
      title: 'Active On-Duty Shift',
      value: `${activeCount}`,
      subtext: 'Shift 1 Morning currently logged in',
      theme: 'theme-green',
      icon: UserCheck,
      tag: 'LOGGED IN',
    },
    {
      title: 'Defined RBAC Roles',
      value: `${rolesCount}`,
      subtext: '5 Standard + 3 Proposed (FR-14–16)',
      theme: 'theme-purple',
      icon: KeyRound,
      tag: 'ROLES CONFIGURED',
    },
    {
      title: 'Security & Access Integrity',
      value: '100%',
      subtext: 'Guarded via requireAuth() framework',
      theme: 'theme-teal',
      icon: ShieldCheck,
      tag: 'RBAC ENFORCED',
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
