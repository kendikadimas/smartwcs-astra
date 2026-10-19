'use client';

import React from 'react';
import { MasterCategoryKey, MasterDataFilterState } from '@/types/masterData';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface MasterDataFilterBarProps {
  activeCategory: MasterCategoryKey;
  filterState: MasterDataFilterState;
  onFilterChange: (updates: Partial<MasterDataFilterState>) => void;
  onClearFilters: () => void;
  onToggleMoreFilters: () => void;
  isMoreFiltersOpen: boolean;
  statusOptions: string[];
  typeOptions: string[];
  modelOptions: string[];
  locationOptions: string[];
}

export function MasterDataFilterBar({
  activeCategory,
  filterState,
  onFilterChange,
  onClearFilters,
  onToggleMoreFilters,
  isMoreFiltersOpen,
  statusOptions,
  typeOptions,
  modelOptions,
  locationOptions,
}: MasterDataFilterBarProps) {
  // Placeholder text adapts to category
  const searchPlaceholder =
    activeCategory === 'robots'
      ? 'Search robot ID, name, model...'
      : activeCategory === 'equipment'
      ? 'Search equipment ID, name, type...'
      : activeCategory === 'locations'
      ? 'Search location code, name, zone...'
      : activeCategory === 'materials'
      ? 'Search SKU, material name...'
      : `Search ${activeCategory}...`;

  const renderDropdownFilter = (
    label: string,
    value: string,
    options: string[],
    onChange: (val: string) => void,
    minWidth = '100px'
  ) => (
    <div
      style={{
        position: 'relative',
        border: '1px solid #e2e8f0',
        borderRadius: '7px',
        backgroundColor: '#ffffff',
        padding: '3px 26px 3px 10px',
        minWidth: minWidth,
        height: '38px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, lineHeight: 1.15 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: '#0f172a',
          fontWeight: 600,
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '120px',
        }}
      >
        {value}
      </span>
      <ChevronDown
        size={13}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none',
        }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      >
        <option value="All">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      {/* Left: Search & Filter Dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            width: '270px',
            minWidth: '220px',
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={filterState.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 32px',
              fontSize: '12px',
              borderRadius: '7px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          />
        </div>

        {/* Status Dropdown */}
        {renderDropdownFilter('Status', filterState.status, statusOptions, (val) =>
          onFilterChange({ status: val })
        )}

        {/* Type Dropdown */}
        {typeOptions.length > 0 &&
          renderDropdownFilter('Type', filterState.type, typeOptions, (val) =>
            onFilterChange({ type: val })
          )}

        {/* Model Dropdown */}
        {modelOptions.length > 0 &&
          renderDropdownFilter('Model', filterState.model, modelOptions, (val) =>
            onFilterChange({ model: val })
          )}

        {/* Location Dropdown */}
        {locationOptions.length > 0 &&
          renderDropdownFilter('Location', filterState.location, locationOptions, (val) =>
            onFilterChange({ location: val })
          )}

        {/* More filters button */}
        <button
          onClick={onToggleMoreFilters}
          style={{
            height: '38px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 12px',
            backgroundColor: isMoreFiltersOpen ? '#eff6ff' : '#ffffff',
            border: isMoreFiltersOpen ? '1px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 500,
            color: isMoreFiltersOpen ? '#2563eb' : '#334155',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <SlidersHorizontal size={13} style={{ color: isMoreFiltersOpen ? '#2563eb' : '#64748b' }} />
          More filters
        </button>

        {/* Clear filters link button */}
        <button
          onClick={onClearFilters}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            fontWeight: 500,
            color: '#2563eb',
            cursor: 'pointer',
            padding: '4px 6px',
            textDecoration: 'none',
          }}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
