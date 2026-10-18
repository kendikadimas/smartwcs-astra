import React from 'react';
import { TaskMetrics } from '@/types/task';
import { ClipboardCheck, Clock, PlayCircle, AlertTriangle, ArrowUp } from 'lucide-react';

interface TaskKpisProps {
  metrics: TaskMetrics;
}

export function TaskKpis({ metrics }: TaskKpisProps) {
  return (
    <div className="kpi-grid-4">
      {/* 1. Total Tasks */}
      <div className="kpi-card kpi-card-with-icon">
        <div className="kpi-icon-box blue">
          <ClipboardCheck size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="kpi-title">Total tasks</span>
          <div className="kpi-value">{metrics.total}</div>
          <div className="kpi-subtext">
            <span className="kpi-delta-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUp size={11} />+{metrics.totalChangePercent}%
            </span>
            <span>vs. previous day</span>
          </div>
        </div>
      </div>

      {/* 2. Queued */}
      <div className="kpi-card kpi-card-with-icon">
        <div className="kpi-icon-box amber">
          <Clock size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="kpi-title">Queued</span>
          <div className="kpi-value">{metrics.queued}</div>
          <div className="kpi-subtext">
            <span>{metrics.queuedPercent}% of total tasks</span>
          </div>
        </div>
      </div>

      {/* 3. Running */}
      <div className="kpi-card kpi-card-with-icon">
        <div className="kpi-icon-box blue">
          <PlayCircle size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="kpi-title">Running</span>
          <div className="kpi-value">{metrics.running}</div>
          <div className="kpi-subtext">
            <span>{metrics.runningPercent}% of total tasks</span>
          </div>
        </div>
      </div>

      {/* 4. Failed */}
      <div className="kpi-card kpi-card-with-icon">
        <div className="kpi-icon-box red">
          <AlertTriangle size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="kpi-title">Failed</span>
          <div className="kpi-value">{metrics.failed}</div>
          <div className="kpi-subtext">
            <span>{metrics.failedPercent}% of total tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
