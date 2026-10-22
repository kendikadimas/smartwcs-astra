'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DispatchKpis } from '@/components/dispatch/DispatchKpis';
import { DispatchToolbar } from '@/components/dispatch/DispatchToolbar';
import { DispatchTable } from '@/components/dispatch/DispatchTable';
import { FleetAllocatorPanel } from '@/components/dispatch/FleetAllocatorPanel';
import { ManualDispatchModal } from '@/components/dispatch/ManualDispatchModal';
import { DispatchDetailDrawer } from '@/components/dispatch/DispatchDetailDrawer';
import { AbortMissionModal } from '@/components/dispatch/AbortMissionModal';
import {
  initialMockMissions,
  mockDispatchMetrics,
  mockFleetResources,
  mockEquipmentResources,
} from '@/data/mockDispatch';
import {
  DispatchMission,
  DispatchFilterState,
  FleetResourceItem,
  EquipmentResourceItem,
} from '@/types/dispatch';
import {
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function DispatchExecutionPage() {
  // Core State
  const [missions, setMissions] = useState<DispatchMission[]>(initialMockMissions);
  const [fleet, setFleet] = useState<FleetResourceItem[]>(mockFleetResources);
  const [equipment] = useState<EquipmentResourceItem[]>(mockEquipmentResources);
  const [isEngineActive, setIsEngineActive] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [filterState, setFilterState] = useState<DispatchFilterState>({
    search: '',
    status: 'ALL',
    resourceType: 'ALL',
    priority: 'ALL',
  });

  // Modal / Drawer Selection State
  const [selectedMission, setSelectedMission] = useState<DispatchMission | null>(null);
  const [abortTargetMission, setAbortTargetMission] = useState<DispatchMission | null>(null);
  const [isManualDispatchOpen, setIsManualDispatchOpen] = useState<boolean>(false);
  const [preselectedRobotId, setPreselectedRobotId] = useState<string | undefined>(undefined);

  // Toast Notification
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: 'success' | 'warning' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Filtered Missions
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      // Status filter
      if (filterState.status !== 'ALL' && m.dispatchStatus !== filterState.status) {
        return false;
      }
      // Resource Type filter
      if (filterState.resourceType !== 'ALL' && m.resourceType !== filterState.resourceType) {
        return false;
      }
      // Priority filter
      if (filterState.priority !== 'ALL' && m.priority !== filterState.priority) {
        return false;
      }
      // Search term
      if (filterState.search.trim()) {
        const query = filterState.search.toLowerCase();
        const matchesId = m.id.toLowerCase().includes(query);
        const matchesTask = m.taskId.toLowerCase().includes(query);
        const matchesResource = m.assignedResource.toLowerCase().includes(query);
        const matchesOrigin = m.origin.toLowerCase().includes(query);
        const matchesDest = m.destination.toLowerCase().includes(query);
        const matchesWaypoint = m.currentWaypoint.toLowerCase().includes(query);
        const matchesPayload = m.payloadId.toLowerCase().includes(query);

        if (!matchesId && !matchesTask && !matchesResource && !matchesOrigin && !matchesDest && !matchesWaypoint && !matchesPayload) {
          return false;
        }
      }
      return true;
    });
  }, [missions, filterState]);

  // Tab Status Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: missions.length,
      Executing: 0,
      Dispatched: 0,
      Queued: 0,
      Delayed: 0,
      Completed: 0,
    };
    missions.forEach((m) => {
      if (counts[m.dispatchStatus] !== undefined) {
        counts[m.dispatchStatus] += 1;
      }
    });
    return counts;
  }, [missions]);

  // Dynamic Metrics
  const dynamicMetrics = useMemo(() => {
    const activeMissions = missions.filter(
      (m) => m.dispatchStatus === 'Executing' || m.dispatchStatus === 'Dispatched' || m.dispatchStatus === 'Delayed'
    ).length;
    const queuedTasks = missions.filter(
      (m) => m.dispatchStatus === 'Queued' || m.dispatchStatus === 'Assigning'
    ).length;
    const fleetReadyCount = fleet.filter((f) => f.status === 'Idle').length;
    const fleetTotalCount = fleet.length;

    return {
      activeMissions,
      queuedTasks,
      fleetReadyCount,
      fleetTotalCount,
      avgDispatchLatencySec: mockDispatchMetrics.avgDispatchLatencySec,
      autoDispatchRate: isEngineActive ? mockDispatchMetrics.autoDispatchRate : 64.2,
      engineStatus: (isEngineActive ? 'Running' : 'Paused') as 'Running' | 'Paused' | 'Degraded',
    };
  }, [missions, fleet, isEngineActive]);

  // Handlers
  const handleToggleEngine = () => {
    setIsEngineActive((prev) => {
      const next = !prev;
      if (next) {
        showToast('success', 'Auto-Dispatch Engine resumed. Round-Robin AMR allocation active.');
      } else {
        showToast('warning', 'Auto-Dispatch Engine paused. System switched to Manual Operator mode.');
      }
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Synced latest telemetry with RCS & PUDU Cloud API.');
    }, 600);
  };

  const handleQuickAssign = (mission: DispatchMission) => {
    // Look for first available Idle AMR
    const availableAmr = fleet.find((r) => r.status === 'Idle' && r.battery >= 20);
    if (!availableAmr) {
      // Open manual dispatch modal with this mission
      setSelectedMission(mission);
      setIsManualDispatchOpen(true);
      return;
    }

    // Auto-pair
    const robotId = availableAmr.id;
    setMissions((prev) =>
      prev.map((m) =>
        m.id === mission.id
          ? {
              ...m,
              assignedResource: robotId,
              dispatchStatus: 'Dispatched',
              stepCurrent: 1,
              progressPercent: 5,
              stepDescription: `Allocated to ${robotId}. Transmitting route package.`,
            }
          : m
      )
    );

    setFleet((prev) =>
      prev.map((r) =>
        r.id === robotId
          ? {
              ...r,
              status: 'Executing',
              currentMissionId: mission.id,
            }
          : r
      )
    );

    showToast(
      'success',
      `Mission ${mission.id} (${mission.taskId}) assigned to ${robotId} via RCS Adapter.`
    );
  };

  const handleConfirmManualDispatch = (
    missionId: string,
    robotId: string,
    reason: string
  ) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? {
              ...m,
              assignedResource: robotId,
              dispatchStatus: 'Dispatched',
              stepCurrent: 1,
              progressPercent: 10,
              isManualDispatch: true,
              overrideReason: reason,
              stepDescription: `Manual dispatch to ${robotId}. Transmitting path plan.`,
            }
          : m
      )
    );

    setFleet((prev) =>
      prev.map((r) =>
        r.id === robotId
          ? {
              ...r,
              status: 'Executing',
              currentMissionId: missionId,
            }
          : r
      )
    );

    showToast(
      'success',
      `Manual dispatch executed: Mission ${missionId} bound to ${robotId}.`
    );
  };

  const handleConfirmAbort = (
    missionId: string,
    reason: string,
    actionType: 'Abort' | 'Requeue' | 'EmergencyStop'
  ) => {
    const target = missions.find((m) => m.id === missionId);
    if (!target) return;

    if (actionType === 'Abort') {
      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId
            ? {
                ...m,
                dispatchStatus: 'Aborted',
                progressPercent: 0,
                stepDescription: `Mission aborted: ${reason}`,
              }
            : m
        )
      );

      // Release robot if was assigned
      if (target.assignedResource && target.assignedResource !== 'Unassigned') {
        setFleet((prev) =>
          prev.map((r) =>
            r.id === target.assignedResource
              ? {
                  ...r,
                  status: 'Idle',
                  currentMissionId: undefined,
                }
              : r
          )
        );
      }

      showToast('warning', `Mission ${missionId} aborted. Fleet resource released to Idle.`);
    } else if (actionType === 'Requeue') {
      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId
            ? {
                ...m,
                assignedResource: 'Unassigned',
                dispatchStatus: 'Queued',
                progressPercent: 0,
                stepCurrent: 0,
                stepDescription: `Re-queued: ${reason}`,
              }
            : m
        )
      );

      // Free previous robot
      if (target.assignedResource && target.assignedResource !== 'Unassigned') {
        setFleet((prev) =>
          prev.map((r) =>
            r.id === target.assignedResource
              ? {
                  ...r,
                  status: 'Idle',
                  currentMissionId: undefined,
                }
              : r
          )
        );
      }

      showToast('info', `Mission ${missionId} returned to dispatch queue for re-assignment.`);
    } else if (actionType === 'EmergencyStop') {
      setMissions((prev) =>
        prev.map((m) =>
          m.id === missionId
            ? {
                ...m,
                dispatchStatus: 'Suspended',
                speedMps: 0,
                stepDescription: `EMERGENCY STOPPED: ${reason}`,
              }
            : m
        )
      );

      if (target.assignedResource && target.assignedResource !== 'Unassigned') {
        setFleet((prev) =>
          prev.map((r) =>
            r.id === target.assignedResource
              ? {
                  ...r,
                  status: 'Fault',
                }
              : r
          )
        );
      }

      showToast('warning', `Emergency halt signal dispatched to ${target.assignedResource}.`);
    }

    // Close detail drawer if currently open for this mission
    if (selectedMission?.id === missionId) {
      setSelectedMission(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Mission ID',
      'Task ID',
      'Type',
      'Priority',
      'Resource',
      'Resource Type',
      'Status',
      'Origin',
      'Destination',
      'Waypoint',
      'Progress %',
      'Battery %',
      'Payload ID',
      'Payload (kg)',
      'Adapter Channel',
      'Dispatched At',
    ];

    const rows = missions.map((m) => [
      m.id,
      m.taskId,
      m.taskType,
      m.priority,
      m.assignedResource,
      m.resourceType,
      m.dispatchStatus,
      m.origin,
      m.destination,
      m.currentWaypoint,
      m.progressPercent,
      m.currentBattery,
      m.payloadId,
      m.payloadWeightKg,
      m.adapterChannel,
      m.dispatchedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dispatch-missions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Exported dispatch execution log to CSV.');
  };

  const availableRobotsForModal = useMemo(() => {
    return fleet.filter((r) => r.status === 'Idle');
  }, [fleet]);

  const queuedMissionsForModal = useMemo(() => {
    return missions.filter(
      (m) => m.dispatchStatus === 'Queued' || m.dispatchStatus === 'Delayed' || m.dispatchStatus === 'Assigning'
    );
  }, [missions]);

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
            <h1 className="page-title" style={{ margin: 0, marginBottom: '4px' }}>
              Dispatch & Execution
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Real-time mission coordination for PUDU AMRs, AGVs, and automated material handling equipment via RCS & PLC adapters.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Export CSV Button */}
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
              Export Missions
            </button>
          </div>
        </div>

        {/* Row 1: KPI Cards */}
        <DispatchKpis metrics={dynamicMetrics} isEngineActive={isEngineActive} />

        {/* Row 2: Dispatch Toolbar (Search, Filter Tabs, Engine Switch, Manual Dispatch Button) */}
        <DispatchToolbar
          filter={filterState}
          onFilterChange={(newFilter) => setFilterState(newFilter)}
          statusCounts={statusCounts}
          isEngineActive={isEngineActive}
          onToggleEngine={handleToggleEngine}
          onOpenManualDispatch={() => {
            setPreselectedRobotId(undefined);
            setIsManualDispatchOpen(true);
          }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Row 3: Main Workspace (Responsive 2-Column or Stacked Layout) */}
        <div className="dispatch-workspace-grid">
          {/* Main Left Column: Dispatch Mission Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Active Dispatch Missions
                  </h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                    Showing {filteredMissions.length} of {missions.length} execution missions across all automation channels
                  </p>
                </div>
              </div>

              <DispatchTable
                missions={filteredMissions}
                onSelectMission={(mission) => setSelectedMission(mission)}
                onOpenAbortModal={(mission) => setAbortTargetMission(mission)}
                onQuickAssign={handleQuickAssign}
              />

              {/* Panel Footer Summary */}
              <div
                style={{
                  padding: '10px 18px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#fafbfc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: '#64748b',
                }}
              >
                <span>Showing {filteredMissions.length} active execution missions</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>Auto-Dispatch scheduler: 10s cycle</span>
                  <span style={{ color: '#cbd5e1' }}>&bull;</span>
                  <span>RCS &amp; PLC Telemetry: Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fleet Allocator & Equipment Status Panel (Sticky on scroll) */}
          <div style={{ position: 'sticky', top: '16px' }}>
            <FleetAllocatorPanel
              fleet={fleet}
              equipment={equipment}
              onSelectRobot={(robot) => {
                if (robot.currentMissionId) {
                  const m = missions.find((x) => x.id === robot.currentMissionId);
                  if (m) setSelectedMission(m);
                } else {
                  setPreselectedRobotId(robot.id);
                  setIsManualDispatchOpen(true);
                }
              }}
              onQuickDispatchRobot={(robotId) => {
                setPreselectedRobotId(robotId);
                setIsManualDispatchOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Slide-over Mission Details Drawer */}
      <DispatchDetailDrawer
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
        onOpenAbortModal={(mission) => {
          setSelectedMission(null);
          setAbortTargetMission(mission);
        }}
      />

      {/* Manual Dispatch Pair Modal */}
      <ManualDispatchModal
        isOpen={isManualDispatchOpen}
        onClose={() => setIsManualDispatchOpen(false)}
        queuedMissions={queuedMissionsForModal}
        availableRobots={availableRobotsForModal}
        preselectedRobotId={preselectedRobotId}
        onConfirmDispatch={handleConfirmManualDispatch}
      />

      {/* Mission Abort / Intervention Modal */}
      <AbortMissionModal
        isOpen={!!abortTargetMission}
        onClose={() => setAbortTargetMission(null)}
        mission={abortTargetMission}
        onConfirmAbort={handleConfirmAbort}
      />

      {/* Toast Notification Banner */}
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
