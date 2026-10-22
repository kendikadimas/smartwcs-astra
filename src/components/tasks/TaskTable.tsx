'use client';

import React, { useState } from 'react';
import { TaskItem } from '@/types/task';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import {
  ArrowUpDown,
  ArrowRight,
  Package,
  Truck,
  ArrowDownToLine,
  Move,
  Inbox,
  MoreHorizontal,
  Eye,
  Ban,
  RotateCcw,
} from 'lucide-react';

interface TaskTableProps {
  tasks: TaskItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewDetails: (task: TaskItem) => void;
  onCancelTask: (task: TaskItem) => void;
  onRetryTask: (task: TaskItem) => void;
  sortColumn: keyof TaskItem | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof TaskItem) => void;
}

export function TaskTable({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onCancelTask,
  onRetryTask,
  sortColumn,
  onSort,
}: TaskTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Transport':
        return <Package size={14} style={{ color: '#64748b' }} />;
      case 'Delivery':
        return <Truck size={14} style={{ color: '#64748b' }} />;
      case 'Pickup':
        return <ArrowDownToLine size={14} style={{ color: '#64748b' }} />;
      case 'Move':
        return <Move size={14} style={{ color: '#64748b' }} />;
      case 'Putaway':
        return <Inbox size={14} style={{ color: '#64748b' }} />;
      default:
        return <Package size={14} style={{ color: '#64748b' }} />;
    }
  };

  const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  return (
    <div
      className="data-table-wrapper"
      style={{
        flex: 1,
        minHeight: '220px',
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '38px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all tasks"
              />
            </th>

            {/* Task ID */}
            <th className="sortable" onClick={() => onSort('id')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>TASK ID</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'id' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Type */}
            <th className="sortable" onClick={() => onSort('type')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>TYPE</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'type' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Origin */}
            <th className="sortable" onClick={() => onSort('origin')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>ORIGIN</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'origin' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Static Arrow Column */}
            <th style={{ width: '24px', textAlign: 'center' }}></th>

            {/* Destination */}
            <th className="sortable" onClick={() => onSort('destination')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>DESTINATION</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'destination' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Priority */}
            <th className="sortable" onClick={() => onSort('priority')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>PRIORITY</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'priority' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Status */}
            <th className="sortable" onClick={() => onSort('status')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>STATUS</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'status' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Resource */}
            <th className="sortable" onClick={() => onSort('resource')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>RESOURCE</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'resource' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Created */}
            <th className="sortable" onClick={() => onSort('createdAt')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>CREATED</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'createdAt' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Elapsed */}
            <th className="sortable" onClick={() => onSort('elapsed')}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>ELAPSED</span>
                <ArrowUpDown size={11} style={{ opacity: sortColumn === 'elapsed' ? 1 : 0.4 }} />
              </div>
            </th>

            {/* Actions */}
            <th style={{ textAlign: 'center', width: '50px' }}>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={12} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                No tasks match the selected search or filter criteria.
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const isSelected = selectedIds.includes(task.id);
              const isDelayed = task.isDelayed || task.elapsed.startsWith('+');

              return (
                <tr key={task.id} style={{ backgroundColor: isSelected ? '#f8fafc' : undefined }}>
                  {/* Row Checkbox */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(task.id)}
                      aria-label={`Select task ${task.id}`}
                    />
                  </td>

                  {/* Task ID */}
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    <button
                      onClick={() => onViewDetails(task)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontWeight: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: 0,
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                      }}
                    >
                      {task.id}
                    </button>
                  </td>

                  {/* Type */}
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {getTypeIcon(task.type)}
                      <span style={{ color: '#334155' }}>{task.type}</span>
                    </div>
                  </td>

                  {/* Origin */}
                  <td style={{ color: '#334155' }}>{task.origin}</td>

                  {/* Arrow */}
                  <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <ArrowRight size={13} />
                  </td>

                  {/* Destination */}
                  <td style={{ color: '#334155' }}>{task.destination}</td>

                  {/* Priority */}
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={task.status} />
                  </td>

                  {/* Resource */}
                  <td
                    style={{
                      color: task.resource === 'Unassigned' ? '#94a3b8' : '#0f172a',
                      fontWeight: task.resource !== 'Unassigned' ? 500 : 400,
                    }}
                  >
                    {task.resource}
                  </td>

                  {/* Created (Time + Date) */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ color: '#0f172a' }}>{task.createdAt}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{task.createdDate}</span>
                    </div>
                  </td>

                  {/* Elapsed */}
                  <td>
                    <span className={isDelayed ? 'elapsed-delay' : ''} style={{ color: isDelayed ? '#dc2626' : '#334155' }}>
                      {task.elapsed}
                    </span>
                  </td>

                  {/* Row Actions Menu */}
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Task actions"
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {activeMenuId === task.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          zIndex: 35,
                          minWidth: '140px',
                          padding: '4px',
                          textAlign: 'left',
                        }}
                      >
                        <button
                          onClick={() => {
                            onViewDetails(task);
                            setActiveMenuId(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            borderRadius: '5px',
                            color: '#0f172a',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Eye size={13} style={{ color: '#0284c7' }} />
                          <span>View Details</span>
                        </button>

                        {task.prdStatus !== 'COMPLETED' && task.prdStatus !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              onCancelTask(task);
                              setActiveMenuId(null);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              borderRadius: '5px',
                              color: '#dc2626',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Ban size={13} />
                            <span>Cancel Task</span>
                          </button>
                        )}

                        {task.prdStatus === 'FAILED' && (
                          <button
                            onClick={() => {
                              onRetryTask(task);
                              setActiveMenuId(null);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              borderRadius: '5px',
                              color: '#0284c7',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <RotateCcw size={13} />
                            <span>Retry Task</span>
                          </button>
                        )}
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
