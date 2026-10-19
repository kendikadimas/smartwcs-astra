'use client';

import React from 'react';
import { WarehouseIsometricCanvas } from './WarehouseIsometricCanvas';
import { mockRobotsList } from '@/data/mockWarehouseMap';

export function IsometricWarehouseMap() {
  const [layers, setLayers] = React.useState({
    zones: true,
    racks: true,
    robots: true,
    routes: true,
    equipment: true,
    safetyZones: false,
  });
  const [selectedRobotId, setSelectedRobotId] = React.useState('AMR-02');

  return (
    <WarehouseIsometricCanvas
      layers={layers}
      viewMode="2.5D"
      searchQuery=""
      selectedRobotId={selectedRobotId}
      onSelectRobot={setSelectedRobotId}
      syncTimestamp="10:24:15 WIB"
    />
  );
}
