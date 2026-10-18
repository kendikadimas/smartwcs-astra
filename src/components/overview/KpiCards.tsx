import React from 'react';
import { OverviewMetrics } from '@/types/overview';

interface KpiCardsProps {
  metrics: OverviewMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const cards = [
    {
      title: 'Active Tasks',
      value: metrics.activeTasks,
      subtext: `${metrics.runningTasks} running · ${metrics.queuedTasks} queued`,
    },
    {
      title: 'Completed Today',
      value: metrics.completedToday,
      subtext: metrics.sinceTime,
    },
    {
      title: 'In Progress',
      value: metrics.inProgress,
      subtext: metrics.inProgressBreakdown,
    },
    {
      title: 'Waiting',
      value: metrics.waiting,
      subtext: metrics.waitingReason,
    },
    {
      title: 'Delayed',
      value: metrics.delayed,
      subtext: metrics.delayedNote,
    },
    {
      title: 'Fleet Availability',
      value: `${metrics.fleetAvailability}%`,
      subtext: metrics.fleetRatio,
    },
  ];

  return (
    <div className="kpi-grid-6">
      {cards.map((card) => (
        <div key={card.title} className="kpi-card">
          <span className="kpi-title">{card.title}</span>
          <span className="kpi-value">{card.value}</span>
          <span className="kpi-subtext">{card.subtext}</span>
        </div>
      ))}
    </div>
  );
}
