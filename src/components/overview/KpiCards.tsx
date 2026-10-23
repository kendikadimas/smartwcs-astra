'use client';

import React from 'react';
import Link from 'next/link';
import { OverviewMetrics } from '@/types/overview';
import {
  Tag,
  CheckCircle2,
  TrendingUp,
  Clock,
  AlertTriangle,
  Bot,
  ChevronRight,
} from 'lucide-react';

interface KpiCardsProps {
  metrics: OverviewMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const cards = [
    {
      title: 'Active Tasks',
      value: metrics.activeTasks,
      subtext: `${metrics.runningTasks} running · ${metrics.queuedTasks} queued`,
      theme: 'theme-blue',
      icon: Tag,
      href: '/tasks?status=Running',
    },
    {
      title: 'Completed Today',
      value: metrics.completedToday,
      subtext: metrics.sinceTime,
      theme: 'theme-orange',
      icon: CheckCircle2,
      href: '/tasks?status=Completed',
    },
    {
      title: 'In Progress',
      value: metrics.inProgress,
      subtext: metrics.inProgressBreakdown,
      theme: 'theme-green',
      icon: TrendingUp,
      href: '/dispatch',
    },
    {
      title: 'Waiting Queue',
      value: metrics.waiting,
      subtext: metrics.waitingReason,
      theme: 'theme-purple',
      icon: Clock,
      href: '/tasks?status=Queued',
    },
    {
      title: 'Delayed Tasks',
      value: metrics.delayed,
      subtext: metrics.delayedNote,
      theme: 'theme-rose',
      icon: AlertTriangle,
      href: '/alarms',
    },
    {
      title: 'Robot Availability',
      value: `${metrics.fleetAvailability}%`,
      subtext: metrics.fleetRatio,
      theme: 'theme-teal',
      icon: Bot,
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
