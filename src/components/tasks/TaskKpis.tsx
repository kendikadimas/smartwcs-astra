'use client';

import React from 'react';
import Link from 'next/link';
import { TaskMetrics } from '@/types/task';
import {
  ClipboardCheck,
  Clock,
  PlayCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface TaskKpisProps {
  metrics: TaskMetrics;
}

export function TaskKpis({ metrics }: TaskKpisProps) {
  const cards = [
    {
      title: 'Total Tasks',
      value: metrics.total,
      subtext: `+${metrics.totalChangePercent}% vs. previous day`,
      theme: 'theme-blue',
      icon: ClipboardCheck,
      href: '/tasks',
    },
    {
      title: 'Queued',
      value: metrics.queued,
      subtext: `${metrics.queuedPercent}% of total tasks`,
      theme: 'theme-orange',
      icon: Clock,
      href: '/tasks?status=Queued',
    },
    {
      title: 'Running',
      value: metrics.running,
      subtext: `${metrics.runningPercent}% of total tasks`,
      theme: 'theme-green',
      icon: PlayCircle,
      href: '/tasks?status=Running',
    },
    {
      title: 'Failed',
      value: metrics.failed,
      subtext: `${metrics.failedPercent}% of total tasks`,
      theme: 'theme-rose',
      icon: AlertTriangle,
      href: '/alarms',
    },
  ];

  return (
    <div className="kpi-grid-4">
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

            {/* Top Bar: Icon + View Detail */}
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
