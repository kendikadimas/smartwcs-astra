'use client';

import React from 'react';
import Link from 'next/link';
import { KpiTopMetrics } from '@/types/kpi';
import {
  Boxes,
  CheckCircle2,
  Timer,
  Zap,
  AlertTriangle,
  Route,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface KpiSummaryCardsProps {
  metrics: KpiTopMetrics;
}

export function KpiSummaryCards({ metrics }: KpiSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Throughput',
      value: `${metrics.totalThroughput}`,
      unit: metrics.throughputUnit,
      subtext: metrics.throughputDiff,
      theme: 'theme-blue',
      icon: Boxes,
      tag: 'SHIFT TARGET MET',
      href: '/tasks',
    },
    {
      title: 'Dispatch Success Rate',
      value: `${metrics.successRate}%`,
      unit: '',
      subtext: metrics.successRateSub,
      theme: 'theme-green',
      icon: CheckCircle2,
      tag: 'PRD SLA: >98%',
      href: '/dispatch',
    },
    {
      title: 'Avg Task Cycle Time',
      value: metrics.avgCycleTime,
      unit: '',
      subtext: metrics.cycleTimeDiff,
      theme: 'theme-teal',
      icon: Timer,
      tag: 'TARGET: <4M 40S',
      href: '/tasks',
    },
    {
      title: 'Fleet Productivity',
      value: `${metrics.fleetUtilization}%`,
      unit: '',
      subtext: metrics.fleetUtilizationSub,
      theme: 'theme-purple',
      icon: Zap,
      tag: '8 AMRS ONLINE',
      href: '/equipment',
    },
    {
      title: 'Alarm MTTR',
      value: metrics.alarmMttr,
      unit: '',
      subtext: metrics.alarmMttrSub,
      theme: 'theme-orange',
      icon: AlertTriangle,
      tag: 'TARGET: <5M',
      href: '/alarms',
    },
    {
      title: 'Total Fleet Mileage',
      value: `${metrics.totalMileageKm}`,
      unit: 'km',
      subtext: metrics.mileageSub,
      theme: 'theme-rose',
      icon: Route,
      tag: 'POSE LOG AUDITED',
      href: '/warehouse-map',
    },
  ];

  return (
    <div className="kpi-grid-6" style={{ marginBottom: '18px' }}>
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

            {/* Header: Icon + View Detail Link */}
            <div className="gradient-card-header">
              <div className="gradient-card-icon-wrap">
                <Icon size={17} />
              </div>
              <Link href={card.href} className="gradient-card-view-btn">
                <span>View Details</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {/* Body */}
            <div className="gradient-card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <div className="gradient-card-title">{card.title}</div>
                {card.tag && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {card.tag}
                  </span>
                )}
              </div>
              <div className="gradient-card-value">
                {card.value}
                {card.unit && (
                  <span style={{ fontSize: '13px', fontWeight: 500, marginLeft: '5px', opacity: 0.9 }}>
                    {card.unit}
                  </span>
                )}
              </div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
