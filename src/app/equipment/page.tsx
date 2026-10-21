'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EquipmentKpis } from '@/components/equipment/EquipmentKpis';
import { EquipmentToolbar } from '@/components/equipment/EquipmentToolbar';
import { RobotFleetTable } from '@/components/equipment/RobotFleetTable';
import { ConveyorsTable } from '@/components/equipment/ConveyorsTable';
import { ChargingStationsPanel } from '@/components/equipment/ChargingStationsPanel';
import { RobotDetailDrawer } from '@/components/equipment/RobotDetailDrawer';
import {
  mockEquipmentMetrics,
  mockRobotsData,
  mockChargingStationsData,
  mockConveyorsData,
  mockLiftersData,
  mockTransferStationsData,
} from '@/data/mockEquipment';
import {
  RobotResourceItem,
  EquipmentFilterState,
} from '@/types/equipment';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Bot,
  Layers,
  Zap,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function EquipmentPage() {
  const [robots, setRobots] = useState<RobotResourceItem[]>(mockRobotsData);
  const [chargingStations, setChargingStations] = useState(mockChargingStationsData);
  const [conveyors] = useState(mockConveyorsData);
  const [lifters] = useState(mockLiftersData);
  const [transferStations] = useState(mockTransferStationsData);
  const [metrics] = useState(mockEquipmentMetrics);

  const [filterState, setFilterState] = useState<EquipmentFilterState>({
    tab: 'all',
    search: '',
    status: 'All Statuses',
    zone: 'All Zones',
  });

  const [selectedRobot, setSelectedRobot] = useState<RobotResourceItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Filtered Robots
  const filteredRobots = useMemo(() => {
    return robots.filter((r) => {
      // Status filter
      if (filterState.status !== 'All Statuses') {
        if (filterState.status === 'Online / Ready' && (!r.online || r.runState !== 'Idle')) return false;
        if (filterState.status === 'Working / Operating' && r.runState !== 'Working') return false;
        if (filterState.status === 'Charging' && !r.isCharging) return false;
        if (filterState.status === 'Fault / Error' && r.runState !== 'Error') return false;
      }

      // Search filter
      if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesSn = r.serialNumber.toLowerCase().includes(q);
        const matchesModel = r.model.toLowerCase().includes(q);
        const matchesIp = r.ipAddress.toLowerCase().includes(q);
        const matchesTask = r.currentTaskId ? r.currentTaskId.toLowerCase().includes(q) : false;

        if (!matchesId && !matchesName && !matchesSn && !matchesModel && !matchesIp && !matchesTask) {
          return false;
        }
      }

      return true;
    });
  }, [robots, filterState]);

  // Filtered Conveyors
  const filteredConveyors = useMemo(() => {
    return conveyors.filter((c) => {
      if (filterState.zone !== 'All Zones' && !c.zone.includes(filterState.zone)) {
        return false;
      }
      if (filterState.status !== 'All Statuses') {
        if (filterState.status === 'Working / Operating' && c.status !== 'Operating') return false;
        if (filterState.status === 'Online / Ready' && c.status !== 'Ready') return false;
        if (filterState.status === 'Fault / Error' && c.status !== 'Fault') return false;
        if (filterState.status === 'Maintenance' && c.status !== 'Maintenance') return false;
      }
      if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q);
      }
      return true;
    });
  }, [conveyors, filterState]);

  // Counts for tabs
  const counts = useMemo(() => {
    const robotCount = robots.length;
    const conveyorCount = conveyors.length + lifters.length + transferStations.length;
    const chargingCount = chargingStations.length;
    return {
      all: robotCount + conveyorCount + chargingCount,
      robots: robotCount,
      conveyors: conveyorCount,
      charging: chargingCount,
    };
  }, [robots, conveyors, lifters, transferStations, chargingStations]);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Live telemetry refreshed from PUDU RCS & PLC Gateways.');
    }, 600);
  };

  const handleSendToDock = (robot: RobotResourceItem) => {
    setRobots((prev) =>
      prev.map((r) =>
        r.id === robot.id
          ? {
              ...r,
              runState: 'Idle',
              moveState: 'Docking',
              isCharging: true,
              chargeStage: 'ConstantCurrent',
              speedMps: 0.0,
            }
          : r
      )
    );

    // Update charging station
    setChargingStations((prev) =>
      prev.map((cs) =>
        cs.id === 'CS-01'
          ? {
              ...cs,
              occupiedCount: Math.min(cs.dockCount, cs.occupiedCount + 1),
              dockedRobots: [
                ...cs.dockedRobots,
                {
                  robotId: robot.id,
                  battery: robot.battery,
                  chargeStage: 'ConstantCurrent',
                  chargingSince: 'Just docked (0 min)',
                },
              ],
            }
          : cs
      )
    );

    if (selectedRobot?.id === robot.id) {
      setSelectedRobot((prev) =>
        prev
          ? {
              ...prev,
              runState: 'Idle',
              moveState: 'Docking',
              isCharging: true,
              chargeStage: 'ConstantCurrent',
              speedMps: 0.0,
            }
          : null
      );
    }

    showToast('success', `Dispatch command sent: ${robot.id} navigating to Charging Dock CS-01.`);
  };

  const handleExportCsv = () => {
    const headers = [
      'Resource ID',
      'Name',
      'Type',
      'Serial Number',
      'Vendor',
      'Online',
      'Run State',
      'Move State',
      'Battery %',
      'Charging',
      'Position X',
      'Position Y',
      'Yaw',
      'Speed (m/s)',
      'Odometer (m)',
      'Run Hours',
      'IP Address',
    ];

    const rows = robots.map((r) => [
      r.id,
      r.name,
      r.robotType,
      r.serialNumber,
      r.vendor,
      r.online ? 'Online' : 'Offline',
      r.runState,
      r.moveState,
      r.battery,
      r.isCharging ? 'Yes' : 'No',
      r.x,
      r.y,
      r.yaw,
      r.speedMps,
      r.totalDistanceMeters,
      r.totalRunHours,
      r.ipAddress,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `syntra-equipment-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Exported equipment fleet telemetry to CSV.');
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingBottom: '32px' }}>
        {/* Page Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                Equipment &amp; Resources
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}
              >
                FR-05 &amp; FR-06 Fleet &amp; PLC Telemetry
              </span>
            </div>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Real-time monitoring, battery health, spatial poses, and diagnostics for PUDU AMRs, conveyors, vertical lifts, and charging hubs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              Export Telemetry
            </button>
          </div>
        </div>

        {/* Row 1: KPI Cards */}
        <EquipmentKpis metrics={metrics} />

        {/* Row 2: Equipment Toolbar */}
        <EquipmentToolbar
          filter={filterState}
          onFilterChange={(newFilter) => setFilterState(newFilter)}
          counts={counts}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Row 3: Dynamic Category Content */}
        {filterState.tab === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AMR Fleet Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Bot size={16} style={{ color: '#00529C' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Active AMR / AGV Fleet
                </h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  ({filteredRobots.length} units online / registered)
                </span>
              </div>
              <RobotFleetTable
                robots={filteredRobots}
                onSelectRobot={(robot) => setSelectedRobot(robot)}
                onSendToDock={handleSendToDock}
              />
            </div>

            {/* Conveyors & Lifts Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Layers size={16} style={{ color: '#00529C' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Conveyors, Vertical Lifts &amp; Transfer Stations
                </h2>
              </div>
              <ConveyorsTable
                conveyors={filteredConveyors}
                lifters={lifters}
                transferStations={transferStations}
              />
            </div>

            {/* Charging Stations Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Zap size={16} style={{ color: '#d97706' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Automatic Charging Stations
                </h2>
              </div>
              <ChargingStationsPanel stations={chargingStations} />
            </div>
          </div>
        )}

        {filterState.tab === 'robots' && (
          <div>
            <RobotFleetTable
              robots={filteredRobots}
              onSelectRobot={(robot) => setSelectedRobot(robot)}
              onSendToDock={handleSendToDock}
            />
          </div>
        )}

        {filterState.tab === 'conveyors' && (
          <div>
            <ConveyorsTable
              conveyors={filteredConveyors}
              lifters={lifters}
              transferStations={transferStations}
            />
          </div>
        )}

        {filterState.tab === 'charging' && (
          <div>
            <ChargingStationsPanel stations={chargingStations} />
          </div>
        )}
      </div>

      {/* Robot Detail Diagnostics Drawer */}
      <RobotDetailDrawer
        robot={selectedRobot}
        onClose={() => setSelectedRobot(null)}
        onSendToDock={handleSendToDock}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor:
              toast.type === 'success'
                ? '#065f46'
                : toast.type === 'warning'
                ? '#9a3412'
                : '#1e3a8a',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '13px',
            fontWeight: 500,
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#34d399' }} />}
          {toast.type === 'warning' && <AlertCircle size={18} style={{ color: '#fdba74' }} />}
          {toast.type === 'info' && <Sparkles size={18} style={{ color: '#93c5fd' }} />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </AppShell>
  );
}
