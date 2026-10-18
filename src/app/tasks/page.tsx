'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TaskKpis } from '@/components/tasks/TaskKpis';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { TaskTable } from '@/components/tasks/TaskTable';
import { TaskPagination } from '@/components/tasks/TaskPagination';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { TaskDetailDrawer } from '@/components/tasks/TaskDetailDrawer';
import { initialMockTasks, mockTaskMetrics } from '@/data/mockTasks';
import { TaskItem, TaskFilterState, TaskMetrics } from '@/types/task';
import { Plus } from 'lucide-react';

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialMockTasks);
  const [filterState, setFilterState] = useState<TaskFilterState>({
    search: '',
    status: 'All',
    taskType: 'All',
    priority: 'All',
    resource: 'All',
    dateRange: 'Today',
  });

  const [sortColumn, setSortColumn] = useState<keyof TaskItem | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);

  // Dynamic filter updates
  const handleFilterChange = (updates: Partial<TaskFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1); // Reset to page 1 on filter
  };

  const handleClearFilters = () => {
    setFilterState({
      search: '',
      status: 'All',
      taskType: 'All',
      priority: 'All',
      resource: 'All',
      dateRange: 'Today',
    });
    setCurrentPage(1);
  };

  // Sorting
  const handleSort = (column: keyof TaskItem) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedTasks.map((t) => t.id));
    }
  };

  // Task Actions
  const handleCreateTask = (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCancelTask = (targetTask: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTask.id
          ? {
              ...t,
              status: 'Failed',
              prdStatus: 'CANCELLED',
              failureReason: 'Cancelled by operator',
            }
          : t
      )
    );
    if (detailTask?.id === targetTask.id) {
      setDetailTask(null);
    }
  };

  const handleRetryTask = (targetTask: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === targetTask.id
          ? {
              ...t,
              status: 'Queued',
              prdStatus: 'QUEUED',
              failureReason: undefined,
              elapsed: '00 min',
            }
          : t
      )
    );
    if (detailTask?.id === targetTask.id) {
      setDetailTask((prev) =>
        prev
          ? {
              ...prev,
              status: 'Queued',
              prdStatus: 'QUEUED',
              failureReason: undefined,
            }
          : null
      );
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Task ID',
      'Type',
      'Origin',
      'Destination',
      'Priority',
      'Status',
      'PRD Status',
      'Resource',
      'Created Time',
      'Created Date',
      'Elapsed',
      'Material',
      'SKU',
      'Quantity',
      'Container ID',
    ];

    const rows = filteredTasks.map((t) => [
      t.id,
      t.type,
      t.origin,
      t.destination,
      t.priority,
      t.status,
      t.prdStatus,
      t.resource,
      t.createdAt,
      t.createdDate,
      t.elapsed,
      t.material || '',
      t.materialSku || '',
      t.quantity || '',
      t.containerId || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `syntra-tasks-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTasks, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `syntra-tasks-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (filterState.search.trim()) {
        const query = filterState.search.toLowerCase();
        const matchesId = task.id.toLowerCase().includes(query);
        const matchesOrigin = task.origin.toLowerCase().includes(query);
        const matchesDest = task.destination.toLowerCase().includes(query);
        const matchesMat = (task.material || '').toLowerCase().includes(query);
        const matchesSku = (task.materialSku || '').toLowerCase().includes(query);
        const matchesRes = task.resource.toLowerCase().includes(query);
        if (!matchesId && !matchesOrigin && !matchesDest && !matchesMat && !matchesSku && !matchesRes) {
          return false;
        }
      }

      // Status
      if (filterState.status !== 'All') {
        if (task.status.toLowerCase() !== filterState.status.toLowerCase()) {
          return false;
        }
      }

      // Task Type
      if (filterState.taskType !== 'All') {
        if (task.type.toLowerCase() !== filterState.taskType.toLowerCase()) {
          return false;
        }
      }

      // Priority
      if (filterState.priority !== 'All') {
        if (task.priority.toLowerCase() !== filterState.priority.toLowerCase()) {
          return false;
        }
      }

      // Resource
      if (filterState.resource !== 'All') {
        if (task.resource !== filterState.resource) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filterState]);

  // Sort Logic
  const sortedTasks = useMemo(() => {
    if (!sortColumn) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === undefined || bVal === undefined) return 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [filteredTasks, sortColumn, sortDirection]);

  // Pagination Logic
  const totalItems = sortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  const paginatedTasks = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedTasks.slice(startIndex, startIndex + pageSize);
  }, [sortedTasks, validCurrentPage, pageSize]);

  // Dynamic KPI counts
  const dynamicKpis: TaskMetrics = useMemo(() => {
    const total = tasks.length;
    const queued = tasks.filter((t) => t.status === 'Queued').length;
    const running = tasks.filter((t) => t.status === 'Running' || t.status === 'Executing').length;
    const failed = tasks.filter((t) => t.status === 'Failed').length;

    return {
      total,
      totalChangePercent: mockTaskMetrics.totalChangePercent,
      queued,
      queuedPercent: Math.round((queued / total) * 100),
      running,
      runningPercent: Math.round((running / total) * 100),
      failed,
      failedPercent: Math.round((failed / total) * 100),
    };
  }, [tasks]);

  return (
    <AppShell>
      {/* Page Title & Action Bar */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">
            Create, monitor, and manage warehouse execution tasks.
          </p>
        </div>

        <div className="page-actions">
          <span style={{ fontSize: '12px', color: '#64748b', marginRight: '6px' }}>
            Illustrative demo data
          </span>

          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
            <Plus size={15} />
            Create task
          </button>
        </div>
      </div>

      {/* Row 1: Four KPI Cards */}
      <TaskKpis metrics={dynamicKpis} />

      {/* Main Task List Panel Container */}
      <div className="panel" style={{ backgroundColor: '#ffffff' }}>
        {/* Panel Header */}
        <div style={{ padding: '14px 18px 10px 18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Task list</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            View, filter, and manage warehouse execution tasks.
          </p>
        </div>

        {/* Filter Controls & Summary Toolbar */}
        <div style={{ padding: '0 18px 12px 18px', borderBottom: '1px solid #e2e8f0' }}>
          <TaskFilterBar
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            taskCounts={{
              total: filteredTasks.length,
              queued: filteredTasks.filter((t) => t.status === 'Queued').length,
              running: filteredTasks.filter(
                (t) => t.status === 'Running' || t.status === 'Executing'
              ).length,
              failed: filteredTasks.filter((t) => t.status === 'Failed').length,
            }}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        </div>

        {/* Interactive Data Table */}
        <TaskTable
          tasks={paginatedTasks}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onViewDetails={(task) => setDetailTask(task)}
          onCancelTask={handleCancelTask}
          onRetryTask={handleRetryTask}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Pagination Bar */}
        <TaskPagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Bottom Note */}
      <div
        style={{
          fontSize: '11px',
          color: '#64748b',
          textAlign: 'right',
          padding: '2px 0 10px 0',
        }}
      >
        Demo snapshot • Delayed is an overlapping active-task flag.
      </div>

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleCreateTask}
      />

      {/* View Task Details Drawer */}
      <TaskDetailDrawer
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onCancelTask={handleCancelTask}
        onRetryTask={handleRetryTask}
      />
    </AppShell>
  );
}
