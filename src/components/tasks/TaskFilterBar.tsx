'use client';

import React, { useState } from 'react';
import { TaskFilterState } from '@/types/task';
import {
  Search,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

interface TaskFilterBarProps {
  filterState: TaskFilterState;
  onFilterChange: (updates: Partial<TaskFilterState>) => void;
  onClearFilters: () => void;
  taskCounts: {
    total: number;
    queued: number;
    running: number;
    failed: number;
  };
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export function TaskFilterBar({
  filterState,
  onFilterChange,
  onClearFilters,
  taskCounts,
  onExportCSV,
  onExportJSON,
}: TaskFilterBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreFiltersModal, setShowMoreFiltersModal] = useState(false);

  const hasActiveFilters =
    filterState.search !== '' ||
    filterState.status !== 'All' ||
    filterState.taskType !== 'All' ||
    filterState.priority !== 'All' ||
    filterState.resource !== 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Filter Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px', minWidth: '220px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search task ID, material, location..."
            value={filterState.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            style={{
              width: '100%',
              height: '34px',
              padding: '0 12px 0 32px',
              fontSize: '12.5px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              outline: 'none',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterState.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            style={{
              height: '34px',
              padding: '0 28px 0 10px',
              fontSize: '12.5px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
            }}
          >
            <option value="All">Status: All</option>
            <option value="Executing">Status: Executing</option>
            <option value="Running">Status: Running</option>
            <option value="Delayed">Status: Delayed</option>
            <option value="Queued">Status: Queued</option>
            <option value="Assigned">Status: Assigned</option>
            <option value="Completed">Status: Completed</option>
            <option value="Failed">Status: Failed</option>
          </select>
          <ChevronDown
            size={13}
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

        {/* Task Type Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterState.taskType}
            onChange={(e) => onFilterChange({ taskType: e.target.value })}
            style={{
              height: '34px',
              padding: '0 28px 0 10px',
              fontSize: '12.5px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
            }}
          >
            <option value="All">Task type: All</option>
            <option value="Transport">Task type: Transport</option>
            <option value="Delivery">Task type: Delivery</option>
            <option value="Pickup">Task type: Pickup</option>
            <option value="Move">Task type: Move</option>
            <option value="Putaway">Task type: Putaway</option>
          </select>
          <ChevronDown
            size={13}
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

        {/* Priority Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterState.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            style={{
              height: '34px',
              padding: '0 28px 0 10px',
              fontSize: '12.5px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
            }}
          >
            <option value="All">Priority: All</option>
            <option value="High">Priority: High</option>
            <option value="Medium">Priority: Medium</option>
            <option value="Normal">Priority: Normal</option>
            <option value="Low">Priority: Low</option>
          </select>
          <ChevronDown
            size={13}
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

        {/* Resource Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterState.resource}
            onChange={(e) => onFilterChange({ resource: e.target.value })}
            style={{
              height: '34px',
              padding: '0 28px 0 10px',
              fontSize: '12.5px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
            }}
          >
            <option value="All">Resource: All</option>
            <option value="AMR-01">AMR-01</option>
            <option value="AMR-02">AMR-02</option>
            <option value="AMR-03">AMR-03</option>
            <option value="AMR-04">AMR-04</option>
            <option value="PUDU-001">PUDU-001</option>
            <option value="Conveyor-01">Conveyor-01</option>
            <option value="Lift-01">Lift-01</option>
            <option value="Unassigned">Unassigned</option>
          </select>
          <ChevronDown
            size={13}
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

        {/* Date Filter */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            style={{ height: '34px', padding: '0 10px', fontSize: '12.5px' }}
          >
            <Calendar size={14} style={{ color: '#64748b' }} />
            <span>Today</span>
            <ChevronDown size={13} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* More Filters Button */}
        <button
          onClick={() => setShowMoreFiltersModal(!showMoreFiltersModal)}
          className="btn-secondary"
          style={{ height: '34px', padding: '0 10px', fontSize: '12.5px' }}
        >
          <SlidersHorizontal size={14} style={{ color: '#64748b' }} />
          <span>More filters</span>
        </button>

        {/* Clear Filters Link */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="btn-link"
            style={{ fontSize: '12.5px', marginLeft: '2px' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Second Line: Counts Summary & Export Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
        }}
      >
        {/* Left summary counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12.5px',
            color: '#64748b',
          }}
        >
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{taskCounts.total} tasks</span>
          <span>·</span>
          <span>{taskCounts.queued} queued</span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284c7', fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
            {taskCounts.running} running
          </span>
          <span>·</span>
          <span>{taskCounts.failed} failed</span>
        </div>

        {/* Right Export Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-secondary"
            style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
          >
            <Download size={13} style={{ color: '#64748b' }} />
            <span>Export</span>
            <ChevronDown size={13} style={{ color: '#64748b' }} />
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 40,
                width: '160px',
                padding: '4px',
              }}
            >
              <button
                onClick={() => {
                  onExportCSV();
                  setShowExportMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#0f172a',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FileSpreadsheet size={14} style={{ color: '#16a34a' }} />
                <span>Export as CSV</span>
              </button>
              <button
                onClick={() => {
                  onExportJSON();
                  setShowExportMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#0f172a',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FileText size={14} style={{ color: '#0284c7' }} />
                <span>Export as JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
