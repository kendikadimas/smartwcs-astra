'use client';

import React from 'react';
import Link from 'next/link';
import { IntegrationMetrics } from '@/types/integration';
import {
  Cable,
  ArrowDownLeft,
  ArrowUpRight,
  Cpu,
  Clock,
  Bot,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface IntegrationKpiCardsProps {
  metrics: IntegrationMetrics;
}

export function IntegrationKpiCards({ metrics }: IntegrationKpiCardsProps) {
  const cards = [
    {
      title: 'Active Adapters',
      value: `${metrics.connectedCount}/${metrics.totalAdapters}`,
      subtext: 'All connectors online & verified',
      theme: 'theme-blue',
      icon: Cable,
      tag: '100% ONLINE',
      href: '#adapters',
    },
    {
      title: 'Inbound Webhooks Today',
      value: metrics.inboundToday.toLocaleString(),
      subtext: '100% acknowledged < 5s deadline',
      theme: 'theme-green',
      icon: ArrowDownLeft,
      tag: 'CALLBACKS HEALTHY',
      href: '#logs',
    },
    {
      title: 'Outbound Commands',
      value: metrics.outboundToday.toLocaleString(),
      subtext: '99.4% delivery mission success',
      theme: 'theme-teal',
      icon: ArrowUpRight,
      tag: 'DISPATCH READY',
      href: '#logs',
    },
    {
      title: 'Queue & Worker Status',
      value: '0 Pending',
      subtext: 'Worker active · 2.0s poll interval',
      theme: 'theme-purple',
      icon: Cpu,
      tag: 'WORKER.TS IDLE',
      href: '#logs',
    },
    {
      title: 'Avg Roundtrip Latency',
      value: `${metrics.avgLatencyMs} ms`,
      subtext: '4ms PLC (LAN) · 142ms Cloud SG',
      theme: 'theme-orange',
      icon: Clock,
      tag: 'NORMAL THRESHOLD',
      href: '#adapters',
    },
    {
      title: 'Last Fleet Sync',
      value: metrics.lastSyncFormatted,
      subtext: '8 AMRs · 4 Maps · 48 Waypoints',
      theme: 'theme-rose',
      icon: Bot,
      tag: 'PUDU CLOUD SYNCED',
      href: '#adapters',
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
              <a href={card.href} className="gradient-card-view-btn">
                <span>View Details</span>
                <ChevronRight size={12} />
              </a>
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
              <div className="gradient-card-value">{card.value}</div>
              <div className="gradient-card-subtext">{card.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
