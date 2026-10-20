'use client';

import React, { useState } from 'react';
import {
  MasterCategoryKey,
  RobotMasterItem,
  EquipmentMasterItem,
  LocationMasterItem,
  MaterialMasterItem,
  ZoneMasterItem,
  ChargingStationMasterItem,
  TaskTypeMasterItem,
  ConveyorMasterItem,
  RackMasterItem,
  WorkstationMasterItem,
  RouteMasterItem,
} from '@/types/masterData';
import {
  MapPin,
  Box,
  Zap,
  AlertTriangle,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Activity,
  Layers,
  Wrench,
  Package,
} from 'lucide-react';

interface MasterDataTableProps {
  activeCategory: MasterCategoryKey;
  data: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (column: string) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onViewDetails: (item: any) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (item: any) => void;
}

export function MasterDataTable({
  activeCategory,
  data,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortColumn,
  sortDirection,
  onViewDetails,
  onEditItem,
  onDeleteItem,
}: MasterDataTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  const renderSortHeader = (label: string, field: string) => (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '10px 14px',
        fontSize: '11.5px',
        fontWeight: 600,
        color: '#475569',
        textAlign: 'left',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span>{label}</span>
        <ArrowUpDown
          size={11}
          style={{
            color: sortColumn === field ? '#2563eb' : '#94a3b8',
          }}
        />
      </div>
    </th>
  );

  const renderTh = (label: string, align: 'left' | 'center' | 'right' = 'left') => (
    <th
      style={{
        padding: '10px 14px',
        fontSize: '11.5px',
        fontWeight: 600,
        color: '#475569',
        textAlign: align,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </th>
  );

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    let bg = '#eff6ff';
    let text = '#2563eb';
    let border = '#bfdbfe';

    const s = status.toLowerCase();
    if (s === 'running') {
      bg = '#eff6ff';
      text = '#2563eb';
      border = '#bfdbfe';
    } else if (s === 'idle' || s === 'active' || s === 'online' || s === 'available') {
      bg = '#f0fdf4';
      text = '#15803d';
      border = '#bbf7d0';
    } else if (s === 'charging' || s === 'occupied' || s === 'low stock') {
      bg = '#fffbeb';
      text = '#b45309';
      border = '#fde68a';
    } else if (s === 'offline' || s === 'inactive' || s === 'stopped') {
      bg = '#f1f5f9';
      text = '#475569';
      border = '#cbd5e1';
    } else if (s === 'fault' || s === 'error' || s === 'blocked') {
      bg = '#fef2f2';
      text = '#b91c1c';
      border = '#fecaca';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5px 9px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span>{status}</span>
      </span>
    );
  };

  // Robot Icon/Avatar - True Isometric rendering matching reference screenshot
  const renderRobotAvatar = (robot: RobotMasterItem) => {
    const isForklift = robot.type.toLowerCase().includes('forklift');
    if (isForklift) {
      return (
        <div
          style={{
            width: '32px',
            height: '30px',
            borderRadius: '6px',
            backgroundColor: '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #fed7aa',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            {/* Forklift chassis */}
            <path d="M 6 20 L 14 24 L 21 20 L 13 16 Z" fill="#ea580c" />
            <path d="M 6 20 L 14 24 L 14 27 L 6 23 Z" fill="#c2410c" />
            <path d="M 14 24 L 21 20 L 21 23 L 14 27 Z" fill="#9a3412" />
            {/* Mast */}
            <path d="M 20 8 L 22 9 L 22 21 L 20 20 Z" fill="#1e293b" />
            <path d="M 23 9 L 25 10 L 25 22 L 23 21 Z" fill="#334155" />
            {/* Forks */}
            <path d="M 21 20 L 27 17 L 28 18 L 22 21 Z" fill="#64748b" />
            {/* Overhead guard */}
            <path d="M 10 10 L 16 7 L 19 9 L 13 12 Z" fill="#334155" />
            <line x1="10" y1="10" x2="10" y2="18" stroke="#334155" strokeWidth="1.5" />
            <line x1="16" y1="7" x2="16" y2="15" stroke="#334155" strokeWidth="1.5" />
          </svg>
        </div>
      );
    }
    return (
      <div
        style={{
          width: '32px',
          height: '30px',
          borderRadius: '6px',
          backgroundColor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #bfdbfe',
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          {/* Isometric AGV Top */}
          <path d="M 16 6 L 26 12 L 16 18 L 6 12 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
          {/* Left Facet */}
          <path d="M 6 12 L 16 18 L 16 23 L 6 17 Z" fill="#1e293b" />
          {/* Right Facet */}
          <path d="M 16 18 L 26 12 L 26 17 L 16 23 Z" fill="#334155" />
          {/* Cyan/Blue Sensor Strip */}
          <path d="M 16 19 L 26 13 L 26 14.5 L 16 20.5 Z" fill="#38bdf8" />
          <path d="M 6 13.5 L 16 19.5 L 16 21 L 6 15 Z" fill="#0284c7" />
          {/* Center Turntable / LIDAR */}
          <ellipse cx="16" cy="12" rx="4" ry="2.2" fill="#0284c7" />
        </svg>
      </div>
    );
  };

  // Battery bar helper - matching screenshot thickness and colors
  const renderBatteryBar = (battery: number) => {
    let barColor = '#059669'; // Emerald green
    if (battery <= 20) barColor = '#ef4444'; // Red
    else if (battery <= 50) barColor = '#f59e0b'; // Amber / Orange

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '46px',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(0, battery))}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: '3px',
            }}
          />
        </div>
        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, width: '28px' }}>
          {battery}%
        </span>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {/* Checkbox */}
            <th style={{ padding: '10px 14px', width: '38px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: '#2563eb',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              />
            </th>

            {activeCategory === 'robots' && (
              <>
                {renderSortHeader('Robot ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Type')}
                {renderTh('Model')}
                {renderSortHeader('Status', 'status')}
                {renderSortHeader('Battery', 'battery')}
                {renderTh('Current Location')}
                {renderTh('Current Task')}
                {renderTh('Last Update')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'equipment' && (
              <>
                {renderSortHeader('Equipment ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Equipment Type')}
                {renderTh('Location')}
                {renderTh('Vendor')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Integration Source')}
                {renderTh('Capabilities')}
                {renderTh('Last Heartbeat')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'locations' && (
              <>
                {renderSortHeader('Location Code', 'code')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Zone')}
                {renderTh('Location Type')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Max Capacity (kg)')}
                {renderTh('Coordinates')}
                {renderTh('Node ID')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'materials' && (
              <>
                {renderSortHeader('SKU', 'sku')}
                {renderSortHeader('Material Name', 'name')}
                {renderTh('Type')}
                {renderTh('Unit')}
                {renderSortHeader('Available Qty', 'availableQty')}
                {renderSortHeader('In Use Qty', 'inUseQty')}
                {renderTh('Weight (kg)')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'zones' && (
              <>
                {renderSortHeader('Zone Code', 'code')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Zone Type')}
                {renderTh('Warehouse')}
                {renderTh('Area (m²)')}
                {renderTh('Location Count')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'charging-stations' && (
              <>
                {renderSortHeader('Station ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Zone')}
                {renderTh('Docks')}
                {renderTh('Power (kW)')}
                {renderTh('In-Use Robot')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'task-types' && (
              <>
                {renderSortHeader('Task Code', 'code')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Default Priority')}
                {renderTh('Timeout (sec)')}
                {renderTh('Allowed Resource')}
                {renderTh('Description')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'conveyors' && (
              <>
                {renderSortHeader('Conveyor ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Line')}
                {renderTh('Zone')}
                {renderTh('Speed (m/s)')}
                {renderTh('Direction')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'racks' && (
              <>
                {renderSortHeader('Rack Code', 'code')}
                {renderTh('Zone')}
                {renderTh('Levels')}
                {renderTh('Bays')}
                {renderTh('Capacity (Pallets)')}
                {renderTh('Occupied')}
                {renderSortHeader('Occupancy %', 'occupancyPercent')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'workstations' && (
              <>
                {renderSortHeader('Station ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Workstation Type')}
                {renderTh('Zone')}
                {renderTh('Operator Assigned')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}

            {activeCategory === 'routes' && (
              <>
                {renderSortHeader('Route ID', 'id')}
                {renderSortHeader('Name', 'name')}
                {renderTh('Origin Location')}
                {renderTh('Destination Location')}
                {renderTh('Resource Type')}
                {renderTh('Distance (m)')}
                {renderSortHeader('Status', 'status')}
                {renderTh('Actions', 'right')}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={12}
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '12.5px',
                }}
              >
                No records found matching your filters.
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isSelected ? '#f8faff' : '#ffffff',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  {/* Row Checkbox */}
                  <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      style={{
                        width: '14px',
                        height: '14px',
                        accentColor: '#2563eb',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    />
                  </td>

                  {/* ROBOTS VIEW */}
                  {activeCategory === 'robots' && (
                    <>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {renderRobotAvatar(item)}
                          <button
                            onClick={() => onViewDetails(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                            }}
                          >
                            {item.id}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>{item.type}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.model}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                      <td style={{ padding: '9px 14px' }}>{renderBatteryBar(item.battery)}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#334155' }}>
                          <MapPin size={13} style={{ color: '#2563eb' }} />
                          <span style={{ fontWeight: 600 }}>{item.currentLocation}</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        {item.currentTask === '—' ? (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                            {item.taskIcon === 'zap' ? (
                              <Zap size={13} style={{ color: '#d97706' }} />
                            ) : item.taskIcon === 'alert' ? (
                              <AlertTriangle size={13} style={{ color: '#ea580c' }} />
                            ) : (
                              <Box size={13} style={{ color: '#64748b' }} />
                            )}
                            <span style={{ whiteSpace: 'nowrap' }}>{item.currentTask}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 500 }}>
                          {item.lastUpdate}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {item.lastUpdateDate}
                        </div>
                      </td>
                    </>
                  )}

                  {/* EQUIPMENT VIEW */}
                  {activeCategory === 'equipment' && (
                    <>
                      <td style={{ padding: '9px 14px' }}>
                        <button
                          onClick={() => onViewDetails(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {item.id}
                        </button>
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: 600, color: '#334155' }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.equipmentType}</td>
                      <td style={{ padding: '9px 14px', color: '#334155' }}>{item.location}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.vendor}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                      <td style={{ padding: '9px 14px', color: '#0284c7', fontSize: '11.5px' }}>{item.integrationSource}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.capabilities?.slice(0, 2).map((cap: string) => (
                            <span
                              key={cap}
                              style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                              }}
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: '11px', color: '#64748b' }}>
                        {item.lastHeartbeat}
                      </td>
                    </>
                  )}

                  {/* LOCATIONS VIEW */}
                  {activeCategory === 'locations' && (
                    <>
                      <td style={{ padding: '9px 14px' }}>
                        <button
                          onClick={() => onViewDetails(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {item.code}
                        </button>
                      </td>
                      <td style={{ padding: '9px 14px', color: '#334155' }}>{item.name}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                          {item.zone}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.locationType}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.maxCapacityKg} kg</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{item.coordinates}</td>
                      <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '11px' }}>{item.nodeId}</td>
                    </>
                  )}

                  {/* MATERIALS VIEW */}
                  {activeCategory === 'materials' && (
                    <>
                      <td style={{ padding: '9px 14px' }}>
                        <button
                          onClick={() => onViewDetails(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {item.sku}
                        </button>
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: 600, color: '#334155' }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.materialType}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600 }}>
                          {item.unit}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', color: '#047857', fontWeight: 700 }}>{item.availableQty}</td>
                      <td style={{ padding: '9px 14px', color: '#b45309', fontWeight: 700 }}>{item.inUseQty}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.weightKg} kg</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* ZONES VIEW */}
                  {activeCategory === 'zones' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.code}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.zoneType}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.warehouse}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.areaM2} m²</td>
                      <td style={{ padding: '9px 14px', color: '#2563eb', fontWeight: 700 }}>{item.locationCount}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* CHARGING STATIONS VIEW */}
                  {activeCategory === 'charging-stations' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.zone}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.availableDocks} / {item.dockCount}</td>
                      <td style={{ padding: '9px 14px', color: '#d97706', fontWeight: 700 }}>{item.powerKw} kW</td>
                      <td style={{ padding: '9px 14px', color: '#2563eb', fontWeight: 600 }}>{item.inUseRobot || '—'}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* TASK TYPES VIEW */}
                  {activeCategory === 'task-types' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.code}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.defaultPriority === 'High' ? '#fef2f2' : '#eff6ff',
                            color: item.defaultPriority === 'High' ? '#dc2626' : '#2563eb',
                            fontWeight: 600,
                          }}
                        >
                          {item.defaultPriority}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>{item.timeoutSec}s</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.allowedResource}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b', fontSize: '11px', maxWidth: '280px' }}>{item.description}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* CONVEYORS VIEW */}
                  {activeCategory === 'conveyors' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.line}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.zone}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.speedMps} m/s</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.direction}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* RACKS VIEW */}
                  {activeCategory === 'racks' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.code}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.zone}</td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>{item.levels}</td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>{item.bays}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.totalCapacityPallets}</td>
                      <td style={{ padding: '9px 14px', color: '#2563eb', fontWeight: 600 }}>{item.occupiedPallets}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.occupancyPercent}%`, height: '100%', backgroundColor: item.occupancyPercent > 85 ? '#ea580c' : '#10b981' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>{item.occupancyPercent}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* WORKSTATIONS VIEW */}
                  {activeCategory === 'workstations' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.workstationType}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.zone}</td>
                      <td style={{ padding: '9px 14px', color: '#0284c7', fontWeight: 600 }}>{item.operatorAssigned || 'Unassigned'}</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* ROUTES VIEW */}
                  {activeCategory === 'routes' && (
                    <>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '9px 14px', color: '#047857', fontWeight: 600 }}>{item.origin}</td>
                      <td style={{ padding: '9px 14px', color: '#2563eb', fontWeight: 600 }}>{item.destination}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b' }}>{item.resourceType}</td>
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 600 }}>{item.distanceMeters} m</td>
                      <td style={{ padding: '9px 14px' }}>{renderStatusBadge(item.status)}</td>
                    </>
                  )}

                  {/* Actions Button & Dropdown */}
                  <td style={{ padding: '9px 14px', textAlign: 'right', position: 'relative' }}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      style={{
                        padding: '4px 6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#64748b',
                      }}
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {openMenuId === item.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '32px',
                          zIndex: 50,
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                          minWidth: '150px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                        }}
                      >
                        <button
                          onClick={() => {
                            onViewDetails(item);
                            setOpenMenuId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Eye size={13} style={{ color: '#2563eb' }} />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            onEditItem(item);
                            setOpenMenuId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Edit2 size={13} style={{ color: '#16a34a' }} />
                          Edit Item
                        </button>
                        <button
                          onClick={() => {
                            onDeleteItem(item);
                            setOpenMenuId(null);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#dc2626',
                            borderTop: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={13} />
                          Delete Item
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
