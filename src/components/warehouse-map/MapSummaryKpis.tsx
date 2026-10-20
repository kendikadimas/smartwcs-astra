'use client';

import React from 'react';
import Link from 'next/link';
import { MapKpiSummary } from '@/types/warehouseMap';
import {
  Radar,
  QrCode,
  BatteryCharging,
  Clock,
  AlertTriangle,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface MapSummaryKpisProps {
  kpis: MapKpiSummary;
}

export function MapSummaryKpis({ kpis }: MapSummaryKpisProps) {
  const cards = [
    {
      title: 'Robots Online',
      value: `${kpis.robotsOnline.current} / ${kpis.robotsOnline.total}`,
      subtext: `${kpis.robotsOnline.percentage}% operational fleet`,
      theme: 'theme-blue',
      icon: Radar,
      href: '/equipment',
    },
    {
      title: 'Active Tasks',
      value: kpis.activeTasks.total,
      subtext: `${kpis.activeTasks.running} running · ${kpis.activeTasks.queued} queued`,
      theme: 'theme-teal',
      icon: QrCode,
      href: '/tasks?status=Running',
    },
    {
      title: 'Charging',
      value: kpis.charging.count,
      subtext: kpis.charging.resources,
      theme: 'theme-orange',
      icon: BatteryCharging,
      href: '/equipment',
    },
    {
      title: 'Idle Fleet',
      value: kpis.idle.count,
      subtext: kpis.idle.note,
      theme: 'theme-green',
      icon: Clock,
      href: '/equipment',
    },
    {
      title: 'Offline / Fault',
      value: kpis.offlineFault.count,
      subtext: kpis.offlineFault.resources,
      theme: 'theme-rose',
      icon: AlertTriangle,
      href: '/alarms',
    },
    {
      title: 'Conveyors',
      value: `${kpis.conveyors.current} / ${kpis.conveyors.total}`,
      subtext: kpis.conveyors.statusText,
      theme: 'theme-purple',
      icon: Layers,
      href: '/equipment',
    },
  ];

  return (
    <div className="kpi-grid-6">
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

            {/* Top Bar: Icon on Left + View Detail on Right */}
            <div className="gradient-card-header">
              <div className="gradient-card-icon-wrap">
                <Icon size={17} />
              </div>
              <Link href={card.href} className="gradient-card-view-btn">
                <span>View Detail</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {/* Card Body */}
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

