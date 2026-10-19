'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MasterDataKpis } from '@/components/master-data/MasterDataKpis';
import { MasterDataCategoryNav } from '@/components/master-data/MasterDataCategoryNav';
import { MasterDataFilterBar } from '@/components/master-data/MasterDataFilterBar';
import { MasterDataTable } from '@/components/master-data/MasterDataTable';
import {
  AddEditModal,
  DetailDrawer,
  DeleteConfirmModal,
  ImportModal,
  MoreFiltersModal,
} from '@/components/master-data/MasterDataModals';
import {
  MasterCategoryKey,
  MasterDataFilterState,
  RobotMasterItem,
} from '@/types/masterData';
import {
  initialMockRobots,
  initialMockEquipment,
  initialMockLocations,
  initialMockMaterials,
  initialMockZones,
  initialMockChargingStations,
  initialMockTaskTypes,
  initialMockConveyors,
  initialMockRacks,
  initialMockWorkstations,
  initialMockRoutes,
  initialMasterDataKpis,
} from '@/data/mockMasterData';
import {
  Upload,
  Download,
  Plus,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function MasterDataPage() {
  // Active Category State (Default: 'robots' matching screenshot)
  const [activeCategory, setActiveCategory] = useState<MasterCategoryKey>('robots');

  // Datasets per category
  const [robots, setRobots] = useState<RobotMasterItem[]>(initialMockRobots);
  const [equipment, setEquipment] = useState(initialMockEquipment);
  const [locations, setLocations] = useState(initialMockLocations);
  const [materials, setMaterials] = useState(initialMockMaterials);
  const [zones, setZones] = useState(initialMockZones);
  const [chargingStations, setChargingStations] = useState(initialMockChargingStations);
  const [taskTypes, setTaskTypes] = useState(initialMockTaskTypes);
  const [conveyors, setConveyors] = useState(initialMockConveyors);
  const [racks, setRacks] = useState(initialMockRacks);
  const [workstations, setWorkstations] = useState(initialMockWorkstations);
  const [routes, setRoutes] = useState(initialMockRoutes);

  // Filter State
  const [filterState, setFilterState] = useState<MasterDataFilterState>({
    search: '',
    status: 'All',
    type: 'All',
    model: 'All',
    location: 'All',
    vendor: 'All',
    batteryMin: 0,
    batteryMax: 100,
  });

  // Sorting & Pagination
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals & Drawers State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Category counts
  const categoryCounts = useMemo<Record<MasterCategoryKey, number>>(
    () => ({
      robots: robots.length,
      equipment: equipment.length,
      locations: locations.length,
      materials: materials.length,
      'task-types': taskTypes.length,
      zones: zones.length,
      'charging-stations': chargingStations.length,
      conveyors: conveyors.length,
      racks: racks.length,
      workstations: workstations.length,
      routes: routes.length,
    }),
    [robots, equipment, locations, materials, taskTypes, zones, chargingStations, conveyors, racks, workstations, routes]
  );

  // Dynamic KPI updates - preserves screenshot totals (48 equipment, 126 locations, 1842 materials)
  const dynamicKpis = useMemo(() => {
    const activeRobots = robots.filter((r) => r.status === 'Running' || r.status === 'Idle' || r.status === 'Charging').length;
    const offlineRobots = robots.filter((r) => r.status === 'Offline').length;
    const faultRobots = robots.filter((r) => r.status === 'Fault').length;

    const eqDelta = equipment.length - initialMockEquipment.length;
    const eqOnlineDelta = equipment.filter((e) => e.status === 'Online').length - initialMockEquipment.filter((e) => e.status === 'Online').length;
    const eqOfflineDelta = equipment.filter((e) => e.status === 'Offline').length - initialMockEquipment.filter((e) => e.status === 'Offline').length;

    const locDelta = locations.length - initialMockLocations.length;
    const locActiveDelta = locations.filter((l) => l.status === 'Active').length - initialMockLocations.filter((l) => l.status === 'Active').length;
    const locInactiveDelta = locations.filter((l) => l.status === 'Inactive').length - initialMockLocations.filter((l) => l.status === 'Inactive').length;

    return {
      robots: { total: robots.length, active: activeRobots, offline: offlineRobots, fault: faultRobots },
      equipment: {
        total: initialMasterDataKpis.equipment.total + eqDelta,
        online: initialMasterDataKpis.equipment.online + eqOnlineDelta,
        offline: initialMasterDataKpis.equipment.offline + eqOfflineDelta,
      },
      locations: {
        total: initialMasterDataKpis.locations.total + locDelta,
        active: initialMasterDataKpis.locations.active + locActiveDelta,
        inactive: initialMasterDataKpis.locations.inactive + locInactiveDelta,
      },
      materials: {
        total: initialMasterDataKpis.materials.total,
        available: initialMasterDataKpis.materials.available,
        inUse: initialMasterDataKpis.materials.inUse,
      },
      taskTypes: { total: taskTypes.length, activeCount: taskTypes.filter((t) => t.status === 'Active').length },
      userRoles: initialMasterDataKpis.userRoles,
    };
  }, [robots, equipment, locations, materials, taskTypes]);

  // Current category dataset
  const currentDataset = useMemo(() => {
    switch (activeCategory) {
      case 'robots':
        return robots;
      case 'equipment':
        return equipment;
      case 'locations':
        return locations;
      case 'materials':
        return materials;
      case 'zones':
        return zones;
      case 'charging-stations':
        return chargingStations;
      case 'task-types':
        return taskTypes;
      case 'conveyors':
        return conveyors;
      case 'racks':
        return racks;
      case 'workstations':
        return workstations;
      case 'routes':
        return routes;
      default:
        return robots;
    }
  }, [activeCategory, robots, equipment, locations, materials, zones, chargingStations, taskTypes, conveyors, racks, workstations, routes]);

  // Unique options for filter dropdowns
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    currentDataset.forEach((item: any) => {
      if (item.status) set.add(item.status);
    });
    return Array.from(set);
  }, [currentDataset]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    currentDataset.forEach((item: any) => {
      if (item.type) set.add(item.type);
      else if (item.equipmentType) set.add(item.equipmentType);
      else if (item.locationType) set.add(item.locationType);
      else if (item.materialType) set.add(item.materialType);
    });
    return Array.from(set);
  }, [currentDataset]);

  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    currentDataset.forEach((item: any) => {
      if (item.model) set.add(item.model);
      else if (item.vendor) set.add(item.vendor);
    });
    return Array.from(set);
  }, [currentDataset]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    currentDataset.forEach((item: any) => {
      if (item.currentLocation) set.add(item.currentLocation);
      else if (item.location) set.add(item.location);
      else if (item.zone) set.add(item.zone);
    });
    return Array.from(set);
  }, [currentDataset]);

  // Category change handler
  const handleSelectCategory = (cat: MasterCategoryKey) => {
    setActiveCategory(cat);
    setSelectedIds([]);
    setCurrentPage(1);
    setFilterState({
      search: '',
      status: 'All',
      type: 'All',
      model: 'All',
      location: 'All',
      vendor: 'All',
      batteryMin: 0,
      batteryMax: 100,
    });
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return currentDataset.filter((item: any) => {
      // Search text
      if (filterState.search) {
        const query = filterState.search.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchId = (item.id || item.code || item.sku)?.toLowerCase().includes(query);
        const matchModel = item.model?.toLowerCase().includes(query);
        const matchLoc = (item.currentLocation || item.location || item.zone)?.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchModel && !matchLoc) return false;
      }

      // Status filter
      if (filterState.status !== 'All') {
        if (item.status?.toLowerCase() !== filterState.status.toLowerCase()) return false;
      }

      // Type filter
      if (filterState.type !== 'All') {
        const t = (item.type || item.equipmentType || item.locationType || item.materialType || '').toLowerCase();
        if (t !== filterState.type.toLowerCase()) return false;
      }

      // Model filter
      if (filterState.model !== 'All') {
        const m = (item.model || item.vendor || '').toLowerCase();
        if (m !== filterState.model.toLowerCase()) return false;
      }

      // Location filter
      if (filterState.location !== 'All') {
        const loc = (item.currentLocation || item.location || item.zone || '').toLowerCase();
        if (loc !== filterState.location.toLowerCase()) return false;
      }

      // Vendor filter
      if (filterState.vendor !== 'All') {
        if (item.vendor?.toLowerCase() !== filterState.vendor.toLowerCase()) return false;
      }

      // Battery min filter
      if (filterState.batteryMin > 0 && item.battery !== undefined) {
        if (item.battery < filterState.batteryMin) return false;
      }

      return true;
    });
  }, [currentDataset, filterState]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination Logic
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((d: any) => d.id));
    }
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (item: any) => {
    if (editItem) {
      // Edit existing
      const updater = (prev: any[]) => prev.map((x) => (x.id === item.id ? item : x));
      if (activeCategory === 'robots') setRobots(updater);
      else if (activeCategory === 'equipment') setEquipment(updater);
      else if (activeCategory === 'locations') setLocations(updater);
      else if (activeCategory === 'materials') setMaterials(updater);
      else if (activeCategory === 'zones') setZones(updater);
      else if (activeCategory === 'charging-stations') setChargingStations(updater);
      else if (activeCategory === 'task-types') setTaskTypes(updater);
      else if (activeCategory === 'conveyors') setConveyors(updater);
      else if (activeCategory === 'racks') setRacks(updater);
      else if (activeCategory === 'workstations') setWorkstations(updater);
      else if (activeCategory === 'routes') setRoutes(updater);
      showToast(`Updated ${item.id || item.code || item.sku} successfully.`);
    } else {
      // Create new
      const adder = (prev: any[]) => [item, ...prev];
      if (activeCategory === 'robots') setRobots(adder);
      else if (activeCategory === 'equipment') setEquipment(adder);
      else if (activeCategory === 'locations') setLocations(adder);
      else if (activeCategory === 'materials') setMaterials(adder);
      else if (activeCategory === 'zones') setZones(adder);
      else if (activeCategory === 'charging-stations') setChargingStations(adder);
      else if (activeCategory === 'task-types') setTaskTypes(adder);
      else if (activeCategory === 'conveyors') setConveyors(adder);
      else if (activeCategory === 'racks') setRacks(adder);
      else if (activeCategory === 'workstations') setWorkstations(adder);
      else if (activeCategory === 'routes') setRoutes(adder);
      showToast(`Created new ${activeCategory.slice(0, -1)} ${item.id || item.code || item.sku}.`);
    }
    setEditItem(null);
  };

  // Delete Item
  const handleConfirmDelete = (item: any) => {
    const filterOut = (prev: any[]) => prev.filter((x) => x.id !== item.id);
    if (activeCategory === 'robots') setRobots(filterOut);
    else if (activeCategory === 'equipment') setEquipment(filterOut);
    else if (activeCategory === 'locations') setLocations(filterOut);
    else if (activeCategory === 'materials') setMaterials(filterOut);
    else if (activeCategory === 'zones') setZones(filterOut);
    else if (activeCategory === 'charging-stations') setChargingStations(filterOut);
    else if (activeCategory === 'task-types') setTaskTypes(filterOut);
    else if (activeCategory === 'conveyors') setConveyors(filterOut);
    else if (activeCategory === 'racks') setRacks(filterOut);
    else if (activeCategory === 'workstations') setWorkstations(filterOut);
    else if (activeCategory === 'routes') setRoutes(filterOut);
    setSelectedIds((prev) => prev.filter((id) => id !== item.id));
    setDeleteItem(null);
    showToast(`Deleted ${item.id || item.code || item.sku} from catalog.`);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const filterOutMany = (prev: any[]) => prev.filter((x) => !selectedIds.includes(x.id));
    if (activeCategory === 'robots') setRobots(filterOutMany);
    else if (activeCategory === 'equipment') setEquipment(filterOutMany);
    else if (activeCategory === 'locations') setLocations(filterOutMany);
    else if (activeCategory === 'materials') setMaterials(filterOutMany);
    else if (activeCategory === 'zones') setZones(filterOutMany);
    else if (activeCategory === 'charging-stations') setChargingStations(filterOutMany);
    else if (activeCategory === 'task-types') setTaskTypes(filterOutMany);
    else if (activeCategory === 'conveyors') setConveyors(filterOutMany);
    else if (activeCategory === 'racks') setRacks(filterOutMany);
    else if (activeCategory === 'workstations') setWorkstations(filterOutMany);
    else if (activeCategory === 'routes') setRoutes(filterOutMany);
    const count = selectedIds.length;
    setSelectedIds([]);
    showToast(`Deleted ${count} selected records.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const itemsToExport = selectedIds.length > 0
      ? filteredData.filter((d: any) => selectedIds.includes(d.id))
      : filteredData;

    if (itemsToExport.length === 0) return;

    const firstItem = itemsToExport[0] as Record<string, any>;
    const keys = Object.keys(firstItem).filter((k) => typeof firstItem[k] !== 'object');
    const headerRow = keys.join(',');
    const rows = itemsToExport.map((item: any) =>
      keys.map((k) => `"${String(item[k] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headerRow, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syntra_master_${activeCategory}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${itemsToExport.length} ${activeCategory} records to CSV.`);
  };

  // Dynamic panel title and description
  const categoryHeaderInfo = useMemo(() => {
    switch (activeCategory) {
      case 'robots':
        return {
          title: 'Robots',
          desc: 'Manage robot fleet data and configuration.',
          btnText: '+ Add Robot',
        };
      case 'equipment':
        return {
          title: 'Equipment',
          desc: 'Manage PLC cell gateways, lifters, wrappers, and fixed warehouse equipment.',
          btnText: '+ Add Equipment',
        };
      case 'locations':
        return {
          title: 'Locations',
          desc: 'Configure storage bays, dropoff points, pickup stands, and coordinate nodes.',
          btnText: '+ Add Location',
        };
      case 'materials':
        return {
          title: 'Materials / SKUs',
          desc: 'Catalog of automotive components, packaging pallets, and inventory items.',
          btnText: '+ Add Material',
        };
      case 'task-types':
        return {
          title: 'Task Types',
          desc: 'Configure task execution parameters, default timeouts, and allowed resources.',
          btnText: '+ Add Task Type',
        };
      case 'zones':
        return {
          title: 'Zones',
          desc: 'Define operational areas: RMW, Receiving, Assembly, Charging, FGW, Dispatch.',
          btnText: '+ Add Zone',
        };
      case 'charging-stations':
        return {
          title: 'Charging Stations',
          desc: 'Autonomous AGV charging dock locations, power ratings, and bay assignments.',
          btnText: '+ Add Charger',
        };
      case 'conveyors':
        return {
          title: 'Conveyor Lines',
          desc: 'Motorized roller conveyors, routing lanes, and line speed parameters.',
          btnText: '+ Add Conveyor',
        };
      case 'racks':
        return {
          title: 'Storage Racks',
          desc: 'High-bay pallet rack configurations, tier counts, and capacity limits.',
          btnText: '+ Add Rack',
        };
      case 'workstations':
        return {
          title: 'Workstations',
          desc: 'Quality control benches, packing stations, and assembly preparation cells.',
          btnText: '+ Add Workstation',
        };
      case 'routes':
        return {
          title: 'Routes & Topology',
          desc: 'Directed aisle transit paths, turn restrictions, and distance matrices.',
          btnText: '+ Add Route',
        };
      default:
        return {
          title: 'Master Data',
          desc: 'Manage core warehouse reference data.',
          btnText: '+ Add Item',
        };
    }
  }, [activeCategory]);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        {/* =========================================================
            1. PAGE HEADER
        ========================================================= */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
            Master Data
          </h1>
          <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0 0' }}>
            Manage core warehouse data including robots, equipment, locations, materials, and system configurations.
          </p>
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={15} style={{ color: '#10b981' }} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* =========================================================
            2. SIX COMPACT SUMMARY CARDS (Matches Screenshot 100%)
        ========================================================= */}
        <MasterDataKpis
          kpis={dynamicKpis}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* =========================================================
            3. HORIZONTAL CATEGORY NAVIGATION BAR
        ========================================================= */}
        <MasterDataCategoryNav
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          counts={categoryCounts}
        />

        {/* =========================================================
            4. MAIN DATA MANAGEMENT PANEL
        ========================================================= */}
        <div
          className="panel"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f5f9',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {categoryHeaderInfo.title}
              </h2>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                {categoryHeaderInfo.desc}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Import Button */}
              <button
                onClick={() => setIsImportOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <Upload size={13} style={{ color: '#64748b' }} />
                Import
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <Download size={13} style={{ color: '#64748b' }} />
                Export
              </button>

              {/* Add Item Primary Button */}
              <button
                onClick={() => {
                  setEditItem(null);
                  setIsAddEditOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(37,99,235,0.25)',
                }}
              >
                <Plus size={14} />
                {categoryHeaderInfo.btnText}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <MasterDataFilterBar
            activeCategory={activeCategory}
            filterState={filterState}
            onFilterChange={(updates) => {
              setFilterState((prev) => ({ ...prev, ...updates }));
              setCurrentPage(1);
            }}
            onClearFilters={() => {
              setFilterState({
                search: '',
                status: 'All',
                type: 'All',
                model: 'All',
                location: 'All',
                vendor: 'All',
                batteryMin: 0,
                batteryMax: 100,
              });
              setCurrentPage(1);
            }}
            onToggleMoreFilters={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            isMoreFiltersOpen={isMoreFiltersOpen}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
            modelOptions={modelOptions}
            locationOptions={locationOptions}
          />

          {/* Bulk Action Bar (when rows are selected) */}
          {selectedIds.length > 0 && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#eff6ff',
                borderBottom: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 600 }}>
                <span>{selectedIds.length} {activeCategory} selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleExportCSV}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#2563eb',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={11} />
                  Export Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#dc2626',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={11} />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    padding: '4px 8px',
                    background: 'none',
                    border: 'none',
                    fontSize: '11px',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <MasterDataTable
            activeCategory={activeCategory}
            data={paginatedData}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onViewDetails={(item) => setDetailItem(item)}
            onEditItem={(item) => {
              setEditItem(item);
              setIsAddEditOpen(true);
            }}
            onDeleteItem={(item) => setDeleteItem(item)}
          />

          {/* Table Footer: Pagination */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} {activeCategory}
              </span>
            </div>

            {/* Page Navigation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous Page"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: '24px',
                    height: '24px',
                    padding: '0 6px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: currentPage === page ? '#2563eb' : 'transparent',
                    color: currentPage === page ? '#ffffff' : '#64748b',
                    fontWeight: currentPage === page ? 600 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            5. MODALS & DRAWERS
        ========================================================= */}
        <AddEditModal
          isOpen={isAddEditOpen}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditItem(null);
          }}
          activeCategory={activeCategory}
          editItem={editItem}
          onSave={handleSaveItem}
        />

        <DetailDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          activeCategory={activeCategory}
        />

        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleConfirmDelete}
        />

        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          activeCategory={activeCategory}
          onImportSuccess={(cnt) => showToast(`Imported ${cnt} new ${activeCategory} records.`)}
        />

        <MoreFiltersModal
          isOpen={isMoreFiltersOpen}
          onClose={() => setIsMoreFiltersOpen(false)}
          filterState={filterState}
          onFilterChange={(updates) => {
            setFilterState((prev) => ({ ...prev, ...updates }));
            setCurrentPage(1);
          }}
        />
      </div>
    </AppShell>
  );
}
