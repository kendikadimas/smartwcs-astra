'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapSummaryKpis } from '@/components/warehouse-map/MapSummaryKpis';
import { MapToolbar } from '@/components/warehouse-map/MapToolbar';
import { WarehouseIsometricCanvas } from '@/components/warehouse-map/WarehouseIsometricCanvas';
import { ActiveRobotsCards } from '@/components/warehouse-map/ActiveRobotsCards';
import { RecentEventsPanel } from '@/components/warehouse-map/RecentEventsPanel';
import {
  mockMapKpis,
  mockRobotsList,
  mockRecentEvents,
} from '@/data/mockWarehouseMap';
import { MapLayerFilters } from '@/types/warehouseMap';
import {
  ChevronDown,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function WarehouseMapPage() {
  // Facility & Telemetry State
  const [selectedFacility, setSelectedFacility] = useState('Main Warehouse · Bekasi (Ground Floor)');
  const [syncTimestamp, setSyncTimestamp] = useState('10:24:15 WIB');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Fullscreen / Enlarged Preview State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Interactive Layer Filters
  const [layers, setLayers] = useState<MapLayerFilters>({
    zones: true,
    racks: true,
    robots: true,
    routes: true,
    equipment: true,
    safetyZones: false,
  });

  // View Mode & Search
  const [viewMode, setViewMode] = useState<'2.5D' | 'Top'>('2.5D');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Robot
  const [selectedRobotId, setSelectedRobotId] = useState<string>('AMR-02');

  // Handle Layer Toggle
  const handleToggleLayer = (layerKey: keyof MapLayerFilters) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Sync Telemetry Handler
  const handleSyncTelemetry = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setSyncTimestamp(`${timeStr} WIB`);
      setIsSyncing(false);
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3000);
    }, 600);
  };

  // Toggle Fullscreen / Enlarged Preview
  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      // Try native HTML5 Fullscreen first
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen().catch(() => {
          // Fallback to overlay fullscreen
        });
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Listen to browser native fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        {/* =========================================================
            1. PAGE HEADER
        ========================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Warehouse Map
            </h1>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
              Live view of warehouse operations, robot fleet, equipment, and task execution.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Facility Selector */}
            <div style={{ position: 'relative' }}>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                style={{
                  appearance: 'none',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 32px 7px 12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <option value="Main Warehouse · Bekasi (Ground Floor)">Main Warehouse · Bekasi (Ground Floor)</option>
                <option value="Main Warehouse · Bekasi (Mezzanine Floor)">Main Warehouse · Bekasi (Mezzanine Floor)</option>
                <option value="Karawang Plant · Staging Area">Karawang Plant · Staging Area</option>
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                }}
              />
            </div>

            {/* Sync Telemetry Button */}
            <button
              onClick={handleSyncTelemetry}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  color: '#10b981',
                  animation: isSyncing ? 'spin 0.6s linear infinite' : 'none',
                }}
              />
              Sync Telemetry
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 16px',
                backgroundColor: '#2563eb',
                border: '1px solid #1d4ed8',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(37,99,235,0.25)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </div>
        </div>

        {/* Sync Confirmation Toast */}
        {showSyncToast && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={14} style={{ color: '#10b981' }} />
            <span>Telemetry synchronized successfully at {syncTimestamp}. Telemetry demo snapshot active.</span>
          </div>
        )}

        {/* =========================================================
            2. SIX COMPACT SUMMARY KPIS
        ========================================================= */}
        <MapSummaryKpis kpis={mockMapKpis} />

        {/* =========================================================
            3. HORIZONTAL MAP TOOLBAR
        ========================================================= */}
        <MapToolbar
          layers={layers}
          onToggleLayer={handleToggleLayer}
          viewMode={viewMode}
          onSelectViewMode={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* =========================================================
            4. MAIN 2.5D ISOMETRIC WAREHOUSE VISUALIZATION
        ========================================================= */}
        <div
          ref={mapContainerRef}
          style={
            isFullscreen
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 99999,
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                }
              : {
                  width: '100%',
                  height: '540px',
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }
          }
        >
          {/* Floating Exit Fullscreen Button in enlarged mode */}
          {isFullscreen && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '320px',
                zIndex: 9999,
              }}
            >
              <button
                onClick={handleToggleFullscreen}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <X size={14} />
                Exit Preview (Esc)
              </button>
            </div>
          )}

          <WarehouseIsometricCanvas
            layers={layers}
            viewMode={viewMode}
            searchQuery={searchQuery}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
            syncTimestamp={syncTimestamp}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>

        {/* =========================================================
            5. BOTTOM SECTION: ACTIVE ROBOTS CARDS & RECENT EVENTS
        ========================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '14px',
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {/* Active Robots Cards */}
          <ActiveRobotsCards
            robots={mockRobotsList}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
          />

          {/* Recent Events Panel */}
          <RecentEventsPanel events={mockRecentEvents} />
        </div>
      </div>
    </AppShell>
  );
}
