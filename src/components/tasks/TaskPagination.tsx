'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface TaskPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TaskPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  onPageSizeChange,
}: TaskPaginationProps) {
  // Generate pagination items
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span
            key={`dots-${idx}`}
            style={{
              padding: '0 6px',
              color: '#94a3b8',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            ...
          </span>
        );
      }

      const isCurrent = page === currentPage;
      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page as number)}
          style={{
            minWidth: '28px',
            height: '28px',
            padding: '0 6px',
            fontSize: '12px',
            fontWeight: isCurrent ? 700 : 500,
            color: isCurrent ? '#ffffff' : '#334155',
            backgroundColor: isCurrent ? '#0284c7' : 'transparent',
            border: isCurrent ? '1px solid #0284c7' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Left: Page Size Selector & Showing X-Y of Z */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#64748b' }}>
        <div style={{ position: 'relative' }}>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              height: '30px',
              padding: '0 24px 0 8px',
              fontSize: '12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
            }}
          >
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <ChevronDown
            size={12}
            style={{
              position: 'absolute',
              right: '7px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#64748b',
            }}
          />
        </div>

        <span>
          Showing {totalItems > 0 ? startItem : 0}-{endItem} of {totalItems} tasks
        </span>
      </div>

      {/* Right: Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            width: '28px',
            height: '28px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? '#cbd5e1' : '#334155',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            width: '28px',
            height: '28px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
          aria-label="Next Page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
