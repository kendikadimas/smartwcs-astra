'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCards } from '@/components/overview/KpiCards';
import { WarehouseSchematic } from '@/components/overview/WarehouseSchematic';
import { RobotFleetTable } from '@/components/overview/RobotFleetTable';
import { EquipmentHealth } from '@/components/overview/EquipmentHealth';
import { IntegrationAdapters } from '@/components/overview/IntegrationAdapters';
import { ActiveTasksMini } from '@/components/overview/ActiveTasksMini';
import { TaskDistributionChart } from '@/components/overview/TaskDistributionChart';
import { RecentEventsList } from '@/components/overview/RecentEventsList';
import { ActiveAlarmsList } from '@/components/overview/ActiveAlarmsList';
import { TaskCompletionTrend } from '@/components/overview/TaskCompletionTrend';
import {
  mockOverviewMetrics,
  mockRobotFleet,
  mockEquipmentHealth,
  mockIntegrationAdapters,
  mockActiveTasksMini,
  mockTaskDistribution,
  mockRecentEvents,
  mockActiveAlarms,
  mockHourlyCompletion,
} from '@/data/mockOverview';
import { ChevronDown, Download } from 'lucide-react';

export default function OperationsOverviewPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState('Main Warehouse · Bekasi');

  const handleExportSummary = () => {
    const summaryData = `SYNTRA Smart WCS - Operations Overview Summary
Generated at: 15 Oct 2026 10:24:15 WIB
Warehouse: ${selectedWarehouse}

[KPI Metrics]
Active Tasks: ${mockOverviewMetrics.activeTasks} (8 running, 4 queued)
Completed Today: ${mockOverviewMetrics.completedToday}
In Progress: ${mockOverviewMetrics.inProgress} (${mockOverviewMetrics.inProgressBreakdown})
Waiting: ${mockOverviewMetrics.waiting}
Delayed: ${mockOverviewMetrics.delayed}
Fleet Availability: ${mockOverviewMetrics.fleetAvailability}% (${mockOverviewMetrics.fleetRatio})

[Equipment Health]
Conveyors: 8/8 ready
Lifts: 2/3 (LIFT-01 fault)
Transfer Stations: 8/8 ready

[System Adapters]
WMS: Connected
RCS: Connected
PLC: Connected
`;
    const blob = new Blob([summaryData], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'operations-summary-bekasi.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      {/* Page Title & Controls Bar */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Operations Overview</h1>
          <p className="page-subtitle">
            Task execution, resource readiness and warehouse coordination.
          </p>
        </div>

        <div className="page-actions">
          {/* Warehouse Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="select-input"
              style={{
                appearance: 'none',
                paddingRight: '28px',
                fontWeight: 500,
                backgroundColor: '#ffffff',
              }}
            >
              <option value="Main Warehouse · Bekasi">Main Warehouse · Bekasi</option>
              <option value="Karawang Plant · Staging">Karawang Plant · Staging</option>
              <option value="Sunter Logistics Hub">Sunter Logistics Hub</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>

          {/* Export Summary Action Button */}
          <button onClick={handleExportSummary} className="btn-primary">
            <Download size={14} />
            Export summary
          </button>
        </div>
      </div>

      {/* Row 1: Six KPI Cards */}
      <KpiCards metrics={mockOverviewMetrics} />

      {/* Row 2: Warehouse Schematic + Robot Fleet Status + Equipment & Integration Panel */}
      <div className="overview-grid-row2">
        {/* Left: Warehouse Schematic */}
        <WarehouseSchematic />

        {/* Middle: Robot Fleet Status Table */}
        <RobotFleetTable fleet={mockRobotFleet} />

        {/* Right: Equipment Health + Integration Adapters Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
          <EquipmentHealth categories={mockEquipmentHealth} />
          <IntegrationAdapters adapters={mockIntegrationAdapters} />
        </div>
      </div>

      {/* Row 3: Active Tasks + Task Distribution + Task Completion Trend */}
      <div className="overview-grid-row3">
        <ActiveTasksMini tasks={mockActiveTasksMini} />
        <TaskDistributionChart distribution={mockTaskDistribution} />
        <TaskCompletionTrend data={mockHourlyCompletion} />
      </div>

      {/* Footer Operational Boundary Disclaimer */}
      <div className="footer-disclaimer">
        <span>
          WCS coordinates tasks &amp; dispatch, WMS: inventory · RCS: robot execution · PLC: equipment control · Safety authority remains external.
        </span>
        <span className="demo-snapshot-tag">DEMO SNAPSHOT · 16 Jun 2025, 10:24:15 WIB</span>
      </div>
    </AppShell>
  );
}
