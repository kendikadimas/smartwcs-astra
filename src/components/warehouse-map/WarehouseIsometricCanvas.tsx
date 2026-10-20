'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  WarehouseRobot,
  MapLayerFilters,
} from '@/types/warehouseMap';
import {
  mockWarehouseZones,
  mockWarehouseRacks,
  mockRobotsList,
} from '@/data/mockWarehouseMap';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Pause,
  Play,
  RotateCw,
  Zap,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

interface WarehouseIsometricCanvasProps {
  layers: MapLayerFilters;
  viewMode: '2.5D' | 'Top';
  searchQuery: string;
  selectedRobotId: string;
  onSelectRobot: (id: string) => void;
  syncTimestamp: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function WarehouseIsometricCanvas({
  layers,
  viewMode,
  searchQuery,
  selectedRobotId,
  onSelectRobot,
  syncTimestamp,
  isFullscreen = false,
  onToggleFullscreen,
}: WarehouseIsometricCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Responsive Container Dimensions
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Robots State
  const [robots, setRobots] = useState<WarehouseRobot[]>(mockRobotsList);
  const [activeFloor, setActiveFloor] = useState<'GF' | '1F' | '2F' | '3F'>('1F');
  const [activeTab, setActiveTab] = useState<'live' | 'task'>('live');
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [actionToast, setActionToast] = useState<{ message: string; type: 'info' | 'warn' | 'success' } | null>(null);

  // Camera State
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.55 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const pulseOffsetRef = useRef(0);

  // Selected Robot
  const selectedRobot = robots.find((r) => r.id === selectedRobotId) || robots[1];

  // Action Button Handlers
  const handlePauseRobot = () => {
    setRobots((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRobot.id) return r;
        const nextStatus = r.status === 'Running' ? 'Idle' : 'Running';
        return {
          ...r,
          status: nextStatus,
          speed: nextStatus === 'Running' ? 1.2 : 0,
        };
      })
    );
    setActionToast({
      message: `[Simulated RCS] Dispatch command issued for ${selectedRobot.id}. Status: ${selectedRobot.status === 'Running' ? 'Paused' : 'Running'}.`,
      type: 'info',
    });
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleRerouteRobot = () => {
    setActionToast({
      message: `[WCS Fleet Router] Dynamic detour route calculated for ${selectedRobot.id}. Avoiding restricted zone.`,
      type: 'success',
    });
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleChargeRobot = () => {
    setRobots((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRobot.id) return r;
        return {
          ...r,
          status: 'Charging',
          speed: 0,
          currentLocation: 'Charging Station Bay 02',
          nextWaypoint: 'Target 95% (30 min)',
        };
      })
    );
    setActionToast({
      message: `[Task Coordination] Automated charging cycle queued for ${selectedRobot.id} (Dock CH-02).`,
      type: 'success',
    });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Resize Observer for auto sharp canvas resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Isometric Projection Parameters (2:1 classic isometric standard)
  const TILE_W = 50;
  const TILE_H = 25;

  // Convert Grid (gx, gy, gz) -> Screen (x, y)
  const gridToScreen = useCallback(
    (gx: number, gy: number, gz = 0) => {
      if (viewMode === 'Top') {
        const scale = 22;
        return { x: gx * scale, y: gy * scale };
      }
      // 2.5D Isometric projection
      const sx = (gx - gy) * (TILE_W / 2);
      const sy = (gx + gy) * (TILE_H / 2) - gz;
      return { x: sx, y: sy };
    },
    [viewMode, TILE_W, TILE_H]
  );

  // Inverse Coordinate Conversion: Screen (x, y) -> Grid (gx, gy)
  const screenToGrid = useCallback(
    (sx: number, sy: number) => {
      if (viewMode === 'Top') {
        const scale = 22;
        return { gx: sx / scale, gy: sy / scale };
      }
      const gx = sx / TILE_W + sy / TILE_H;
      const gy = sy / TILE_H - sx / TILE_W;
      return { gx, gy };
    },
    [viewMode, TILE_W, TILE_H]
  );

  // Center Camera: Fits entire warehouse from left door to right trucks perfectly in view
  const resetCamera = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const rightPanelW = clientWidth > 960 ? 300 : 0;
    const leftControlsW = 60;
    const availW = Math.max(clientWidth - rightPanelW - leftControlsW, 400);
    const availH = Math.max(clientHeight - 40, 300);

    if (viewMode === 'Top') {
      const scale = 22;
      const totalW = 42 * scale;
      const totalH = 26 * scale;

      const idealZoom = Math.min(availW / totalW, availH / totalH, 1.2) * 0.95;
      const targetScreenX = leftControlsW + availW / 2;
      const targetScreenY = clientHeight / 2;

      setCamera({
        x: targetScreenX - (totalW / 2) * idealZoom,
        y: targetScreenY - (totalH / 2) * idealZoom,
        zoom: idealZoom,
      });
      return;
    }

    // 2.5D Isometric Mode
    // Screen bounds of entire warehouse in isometric units:
    // Min SX = -650, Max SX = +780 -> Width = 1430px, Center X = +65px
    // Min SY = -85, Max SY = +720 -> Height = 805px, Center Y = +317px

    const idealZoom = Math.min(availW / 1460, availH / 840, 1.2) * 0.96;
    const targetScreenX = leftControlsW + availW / 2;
    const targetScreenY = 16 + availH / 2;

    setCamera({
      x: targetScreenX - 65 * idealZoom,
      y: targetScreenY - 317 * idealZoom,
      zoom: idealZoom,
    });
  }, [viewMode]);

  useEffect(() => {
    resetCamera();
  }, [resetCamera, viewMode, isFullscreen, containerSize]);

  // Mouse Interaction: Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setCamera((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel: Zoom centered on pointer
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setCamera((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.35), 2.5);
      const newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom);
      const newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom);
      return { x: newX, y: newY, zoom: newZoom };
    });
  };

  // Click on Canvas: Hit Test for Robot Markers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - camera.x) / camera.zoom;
    const worldY = (clickY - camera.y) / camera.zoom;

    robots.forEach((robot) => {
      const pos = gridToScreen(robot.gx, robot.gy);
      const dist = Math.hypot(worldX - pos.x, worldY - pos.y);
      if (dist < 34) {
        onSelectRobot(robot.id);
      }
    });
  };

  // Live Simulation Loop (Moving AMR-02 and PUDU-001 along waypoints)
  useEffect(() => {
    const interval = setInterval(() => {
      pulseOffsetRef.current = (pulseOffsetRef.current + 0.05) % 1;

      setRobots((prev) =>
        prev.map((robot) => {
          if (robot.status !== 'Running' || robot.path.length < 2) return robot;

          const target = robot.path[1];
          const dx = target.x - robot.gx;
          const dy = target.y - robot.gy;
          const dist = Math.hypot(dx, dy);
          const step = 0.035;

          if (dist < step) {
            const newPath = [...robot.path.slice(1), robot.path[0]];
            return {
              ...robot,
              gx: target.x,
              gy: target.y,
              path: newPath,
            };
          } else {
            return {
              ...robot,
              gx: robot.gx + (dx / dist) * step,
              gy: robot.gy + (dy / dist) * step,
            };
          }
        })
      );
    }, 32);

    return () => clearInterval(interval);
  }, []);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 1000;
    const height = canvas.parentElement?.clientHeight || 600;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Modern crisp off-white canvas background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const GRID_W = 32;
    const GRID_H = 25;

    // =============================================================
    // 1. OUTDOOR TRUCK STAGING APRON & LOADING YARD (Right Wall)
    // =============================================================
    if (viewMode === '2.5D') {
      const a1 = gridToScreen(GRID_W, 11, 0);
      const a2 = gridToScreen(41, 11, 0);
      const a3 = gridToScreen(41, 25, 0);
      const a4 = gridToScreen(GRID_W, 25, 0);

      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.lineTo(a3.x, a3.y);
      ctx.lineTo(a4.x, a4.y);
      ctx.closePath();
      ctx.fillStyle = '#1e293b'; // High-contrast outdoor asphalt
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Staging Guide Stripes on Asphalt
      [13.5, 17.5, 21.5].forEach((ly) => {
        const pL = gridToScreen(GRID_W + 0.8, ly, 0);
        const pR = gridToScreen(40.2, ly, 0);
        ctx.beginPath();
        ctx.moveTo(pL.x, pL.y);
        ctx.lineTo(pR.x, pR.y);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([7, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // =============================================================
    // 2. WAREHOUSE CONCRETE SLAB BASE & EDGE FOUNDATION
    // =============================================================
    const fTop = gridToScreen(0, 0);
    const fRight = gridToScreen(GRID_W, 0);
    const fBottom = gridToScreen(GRID_W, GRID_H);
    const fLeft = gridToScreen(0, GRID_H);

    // Foundation beveled front edges (depth gz: -6)
    if (viewMode === '2.5D') {
      const fBottomDrop = gridToScreen(GRID_W, GRID_H, -6);
      const fLeftDrop = gridToScreen(0, GRID_H, -6);
      const fRightDrop = gridToScreen(GRID_W, 0, -6);

      // Front-left edge bevel
      ctx.beginPath();
      ctx.moveTo(fLeft.x, fLeft.y);
      ctx.lineTo(fBottom.x, fBottom.y);
      ctx.lineTo(fBottomDrop.x, fBottomDrop.y);
      ctx.lineTo(fLeftDrop.x, fLeftDrop.y);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // Front-right edge bevel
      ctx.beginPath();
      ctx.moveTo(fBottom.x, fBottom.y);
      ctx.lineTo(fRight.x, fRight.y);
      ctx.lineTo(fRightDrop.x, fRightDrop.y);
      ctx.lineTo(fBottomDrop.x, fBottomDrop.y);
      ctx.closePath();
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    // Concrete Slab Main Face (Solid industrial concrete tone)
    ctx.beginPath();
    ctx.moveTo(fTop.x, fTop.y);
    ctx.lineTo(fRight.x, fRight.y);
    ctx.lineTo(fBottom.x, fBottom.y);
    ctx.lineTo(fLeft.x, fLeft.y);
    ctx.closePath();
    ctx.fillStyle = '#eef2f6';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle Concrete Expansion Tile Joint Grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x <= GRID_W; x += 2) {
      const p1 = gridToScreen(x, 0);
      const p2 = gridToScreen(x, GRID_H);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y += 2) {
      const p1 = gridToScreen(0, y);
      const p2 = gridToScreen(GRID_W, y);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Yellow Floor Walkway & Transit Corridors (Painted Safety Lines)
    const yLane1A = gridToScreen(1, 10.5);
    const yLane1B = gridToScreen(GRID_W - 1, 10.5);
    ctx.beginPath();
    ctx.moveTo(yLane1A.x, yLane1A.y);
    ctx.lineTo(yLane1B.x, yLane1B.y);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    const yLane2A = gridToScreen(1, 11.5);
    const yLane2B = gridToScreen(GRID_W - 1, 11.5);
    ctx.beginPath();
    ctx.moveTo(yLane2A.x, yLane2A.y);
    ctx.lineTo(yLane2B.x, yLane2B.y);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Pedestrian Zebra Crosswalk at Main Intersection
    for (let zw = 10; zw <= 12; zw += 0.5) {
      const z1 = gridToScreen(zw, 10.6);
      const z2 = gridToScreen(zw, 11.4);
      ctx.beginPath();
      ctx.moveTo(z1.x, z1.y);
      ctx.lineTo(z2.x, z2.y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // =============================================================
    // 3. WAREHOUSE EXTERIOR WALLS, CLERESTORY & LOADING DOORS
    // =============================================================
    if (viewMode === '2.5D') {
      const WALL_H = 85;

      // --- Left Wall (gx: 0, gy: 0 to 25) ---
      const lTopL = gridToScreen(0, 0, WALL_H);
      const lTopR = gridToScreen(0, GRID_H, WALL_H);
      const lBotR = gridToScreen(0, GRID_H, 0);
      const lBotL = gridToScreen(0, 0, 0);

      ctx.beginPath();
      ctx.moveTo(lTopL.x, lTopL.y);
      ctx.lineTo(lTopR.x, lTopR.y);
      ctx.lineTo(lBotR.x, lBotR.y);
      ctx.lineTo(lBotL.x, lBotL.y);
      ctx.closePath();
      ctx.fillStyle = '#cbd5e1'; // Solid left wall
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Steel Columns along Left Wall
      [0, 6, 12, 18, 24].forEach((cy) => {
        const cBase = gridToScreen(0, cy, 0);
        const cTop = gridToScreen(0, cy, WALL_H);
        ctx.beginPath();
        ctx.moveTo(cBase.x, cBase.y);
        ctx.lineTo(cTop.x, cTop.y);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      // Left Inbound Roll-Up Shutter Door (Receiving Bay)
      const rd1 = gridToScreen(0, 13, 0);
      const rd2 = gridToScreen(0, 18, 0);
      const rd3 = gridToScreen(0, 18, 48);
      const rd4 = gridToScreen(0, 13, 48);

      ctx.beginPath();
      ctx.moveTo(rd1.x, rd1.y);
      ctx.lineTo(rd2.x, rd2.y);
      ctx.lineTo(rd3.x, rd3.y);
      ctx.lineTo(rd4.x, rd4.y);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Roll-up door horizontal slats
      for (let s = 6; s < 48; s += 6) {
        const s1 = gridToScreen(0, 13, s);
        const s2 = gridToScreen(0, 18, s);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Yellow safety bollards at receiving door
      [12.6, 18.4].forEach((by) => {
        const bBase = gridToScreen(0.4, by, 0);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(bBase.x - 2.5, bBase.y - 12, 5, 12);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bBase.x - 2.5, bBase.y - 8, 5, 3);
      });

      // --- Rear Wall (gx: 0 to 32, gy: 0) ---
      const wTopL = gridToScreen(0, 0, WALL_H);
      const wTopR = gridToScreen(GRID_W, 0, WALL_H);
      const wBotR = gridToScreen(GRID_W, 0, 0);
      const wBotL = gridToScreen(0, 0, 0);

      ctx.beginPath();
      ctx.moveTo(wTopL.x, wTopL.y);
      ctx.lineTo(wTopR.x, wTopR.y);
      ctx.lineTo(wBotR.x, wBotR.y);
      ctx.lineTo(wBotL.x, wBotL.y);
      ctx.closePath();
      ctx.fillStyle = '#e2e8f0'; // Solid rear wall
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Daylight Clerestory Window Band
      const winTopL = gridToScreen(2, 0, 78);
      const winTopR = gridToScreen(30, 0, 78);
      const winBotR = gridToScreen(30, 0, 56);
      const winBotL = gridToScreen(2, 0, 56);

      ctx.beginPath();
      ctx.moveTo(winTopL.x, winTopL.y);
      ctx.lineTo(winTopR.x, winTopR.y);
      ctx.lineTo(winBotR.x, winBotR.y);
      ctx.lineTo(winBotL.x, winBotL.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(147, 197, 253, 0.75)'; // Luminous sky daylight cyan
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Window Mullions
      for (let mx = 4; mx <= 29; mx += 3) {
        const mTop = gridToScreen(mx, 0, 78);
        const mBot = gridToScreen(mx, 0, 56);
        ctx.beginPath();
        ctx.moveTo(mTop.x, mTop.y);
        ctx.lineTo(mBot.x, mBot.y);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Overhead Structural Roof Trusses
      [8, 16, 24].forEach((tx) => {
        const tStart = gridToScreen(tx, 0, WALL_H);
        const tEnd = gridToScreen(tx, GRID_H, WALL_H);
        ctx.beginPath();
        ctx.moveTo(tStart.x, tStart.y);
        ctx.lineTo(tEnd.x, tEnd.y);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // --- Right Wall (Loading Bay Doors 001, 002, 003) ---
      const rTopL = gridToScreen(GRID_W, 0, WALL_H);
      const rTopR = gridToScreen(GRID_W, GRID_H, WALL_H);
      const rBotR = gridToScreen(GRID_W, GRID_H, 0);
      const rBotL = gridToScreen(GRID_W, 0, 0);

      ctx.beginPath();
      ctx.moveTo(rTopL.x, rTopL.y);
      ctx.lineTo(rTopR.x, rTopR.y);
      ctx.lineTo(rBotR.x, rBotR.y);
      ctx.lineTo(rBotL.x, rBotL.y);
      ctx.closePath();
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3 Roll-Up Loading Dock Doors
      [12.5, 16.5, 20.5].forEach((doorY, i) => {
        const d1 = gridToScreen(GRID_W, doorY, 0);
        const d2 = gridToScreen(GRID_W, doorY + 2.5, 0);
        const d3 = gridToScreen(GRID_W, doorY + 2.5, 46);
        const d4 = gridToScreen(GRID_W, doorY, 46);

        // Black Rubber Dock Shelter
        ctx.beginPath();
        ctx.moveTo(d1.x, d1.y);
        ctx.lineTo(d2.x, d2.y);
        ctx.lineTo(d3.x, d3.y);
        ctx.lineTo(d4.x, d4.y);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Door Grooves
        for (let sh = 6; sh < 46; sh += 6) {
          const sL = gridToScreen(GRID_W, doorY, sh);
          const sR = gridToScreen(GRID_W, doorY + 2.5, sh);
          ctx.beginPath();
          ctx.moveTo(sL.x, sL.y);
          ctx.lineTo(sR.x, sR.y);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Yellow Door Bay Header & Label (001, 002, 003)
        const labelPos = gridToScreen(GRID_W, doorY + 1.25, 54);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(labelPos.x - 14, labelPos.y - 8, 28, 14, 3);
        ctx.fill();

        ctx.font = 'bold 9.5px monospace';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(`00${i + 1}`, labelPos.x, labelPos.y + 3);

        // 3D Delivery Semi-Trucks at Docks 001 & 002
        if (i < 2) {
          const truckY1 = doorY + 0.35;
          const truckY2 = doorY + 2.15;
          const trH = 40;

          // Trailer Cargo Box
          const trBL = gridToScreen(GRID_W + 0.1, truckY2, 0);
          const trBR = gridToScreen(GRID_W + 5.5, truckY2, 0);
          const trBackR = gridToScreen(GRID_W + 5.5, truckY1, 0);
          const trBackL = gridToScreen(GRID_W + 0.1, truckY1, 0);

          const trTL = { x: trBL.x, y: trBL.y - trH };
          const trTR = { x: trBR.x, y: trBR.y - trH };
          const trTBackR = { x: trBackR.x, y: trBackR.y - trH };
          const trTBackL = { x: trBackL.x, y: trBackL.y - trH };

          // Roof Face
          ctx.beginPath();
          ctx.moveTo(trTL.x, trTL.y);
          ctx.lineTo(trTR.x, trTR.y);
          ctx.lineTo(trTBackR.x, trTBackR.y);
          ctx.lineTo(trTBackL.x, trTBackL.y);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          // Side Face
          ctx.beginPath();
          ctx.moveTo(trBL.x, trBL.y);
          ctx.lineTo(trBR.x, trBR.y);
          ctx.lineTo(trTR.x, trTR.y);
          ctx.lineTo(trTL.x, trTL.y);
          ctx.closePath();
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          // Ribs
          for (let rx = GRID_W + 1.2; rx <= GRID_W + 5.0; rx += 0.9) {
            const rBase = gridToScreen(rx, truckY2, 0);
            ctx.beginPath();
            ctx.moveTo(rBase.x, rBase.y);
            ctx.lineTo(rBase.x, rBase.y - trH);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Dual Tires
          [GRID_W + 2.2, GRID_W + 3.8].forEach((wx) => {
            const wPos = gridToScreen(wx, truckY2 + 0.1, 0);
            ctx.beginPath();
            ctx.ellipse(wPos.x, wPos.y - 4, 6, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(wPos.x, wPos.y - 4, 2.5, 1.8, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#cbd5e1';
            ctx.fill();
          });

          // Tractor Cabin (gx: +5.5 to +8.2, height: 44)
          const cabH = 44;
          const cabBL = gridToScreen(GRID_W + 5.5, truckY2, 0);
          const cabBR = gridToScreen(GRID_W + 8.2, truckY2, 0);
          const cabBackR = gridToScreen(GRID_W + 8.2, truckY1, 0);
          const cabBackL = gridToScreen(GRID_W + 5.5, truckY1, 0);

          const cabTL = { x: cabBL.x, y: cabBL.y - cabH };
          const cabTR = { x: cabBR.x, y: cabBR.y - cabH };
          const cabTBackR = { x: cabBackR.x, y: cabBackR.y - cabH };
          const cabTBackL = { x: cabBackL.x, y: cabBackL.y - cabH };

          ctx.beginPath();
          ctx.moveTo(cabTL.x, cabTL.y);
          ctx.lineTo(cabTR.x, cabTR.y);
          ctx.lineTo(cabTBackR.x, cabTBackR.y);
          ctx.lineTo(cabTBackL.x, cabTBackL.y);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cabBL.x, cabBL.y);
          ctx.lineTo(cabBR.x, cabBR.y);
          ctx.lineTo(cabTR.x, cabTR.y);
          ctx.lineTo(cabTL.x, cabTL.y);
          ctx.closePath();
          ctx.fillStyle = '#f1f5f9';
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.stroke();

          // Angled Windshield
          const ws1 = gridToScreen(GRID_W + 8.2, truckY2 - 0.2, 16);
          const ws2 = gridToScreen(GRID_W + 8.2, truckY1 + 0.2, 16);
          const ws3 = gridToScreen(GRID_W + 7.4, truckY1 + 0.2, 38);
          const ws4 = gridToScreen(GRID_W + 7.4, truckY2 - 0.2, 38);

          ctx.beginPath();
          ctx.moveTo(ws1.x, ws1.y);
          ctx.lineTo(ws2.x, ws2.y);
          ctx.lineTo(ws3.x, ws3.y);
          ctx.lineTo(ws4.x, ws4.y);
          ctx.closePath();
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.strokeStyle = '#0369a1';
          ctx.stroke();

          // Front Headlights
          const frontPos = gridToScreen(GRID_W + 8.2, (truckY1 + truckY2) / 2, 7);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(frontPos.x - 3, frontPos.y - 3, 6, 4);

          // Front Steer Tire
          const fWheel = gridToScreen(GRID_W + 7.2, truckY2 + 0.1, 0);
          ctx.beginPath();
          ctx.ellipse(fWheel.x, fWheel.y - 4, 6, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(fWheel.x, fWheel.y - 4, 2.5, 1.8, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#cbd5e1';
          ctx.fill();
        }
      });
    }

    // =============================================================
    // 4. WAREHOUSE ZONES (Colored carpets & floating pill badges)
    // =============================================================
    if (layers.zones) {
      mockWarehouseZones.forEach((zone) => {
        const z1 = gridToScreen(zone.gx, zone.gy);
        const z2 = gridToScreen(zone.gx + zone.gw, zone.gy);
        const z3 = gridToScreen(zone.gx + zone.gw, zone.gy + zone.gh);
        const z4 = gridToScreen(zone.gx, zone.gy + zone.gh);

        ctx.beginPath();
        ctx.moveTo(z1.x, z1.y);
        ctx.lineTo(z2.x, z2.y);
        ctx.lineTo(z3.x, z3.y);
        ctx.lineTo(z4.x, z4.y);
        ctx.closePath();
        ctx.fillStyle = zone.color;
        ctx.fill();
        ctx.strokeStyle = zone.borderColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Floating Pill Badge
        const badgePos = gridToScreen(zone.gx + 0.8, zone.gy + 0.8);
        const badgeW = 114;
        const badgeH = 26;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(badgePos.x - 4, badgePos.y - 13, badgeW, badgeH, 6);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = zone.borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Icon Square
        ctx.fillStyle = zone.badgeBg;
        ctx.beginPath();
        ctx.roundRect(badgePos.x, badgePos.y - 9, 18, 18, 4);
        ctx.fill();

        // Badge Icon Indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.code.substring(0, 1), badgePos.x + 9, badgePos.y + 4);

        // Title
        ctx.font = 'bold 9.5px Inter, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText(zone.name, badgePos.x + 23, badgePos.y - 1);

        // Subtitle
        ctx.font = '8px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(zone.subtitle, badgePos.x + 23, badgePos.y + 9);
      });
    }

    // =============================================================
    // 5. INBOUND CONVEYOR SYSTEM (Receiving Area)
    // =============================================================
    if (layers.equipment) {
      const c1 = gridToScreen(1.2, 13.5, 0);
      const c2 = gridToScreen(1.2, 18.5, 0);
      const c3 = gridToScreen(5.5, 18.5, 0);

      // Conveyor Bed Frame
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y - 10);
      ctx.lineTo(c2.x, c2.y - 10);
      ctx.lineTo(c3.x, c3.y - 10);
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Metallic Rollers & Cargo Trays
      [14, 15.5, 17, 18.5].forEach((cy) => {
        const pt = gridToScreen(1.2, cy, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(pt.x - 5, pt.y - 4, 10, 6);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(pt.x - 5, pt.y - 4, 10, 6);
      });
    }

    // =============================================================
    // 6. CHARGING PADS (Depot Area)
    // =============================================================
    if (layers.equipment) {
      [12, 13.5, 15].forEach((chY, idx) => {
        const cp = gridToScreen(11.5, chY);
        ctx.beginPath();
        ctx.ellipse(cp.x, cp.y, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#fef3c7' : '#ecfdf5';
        ctx.fill();
        ctx.strokeStyle = idx === 0 ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 8.5px sans-serif';
        ctx.fillStyle = idx === 0 ? '#b45309' : '#15803d';
        ctx.textAlign = 'center';
        ctx.fillText(`CH-0${idx + 1}`, cp.x, cp.y + 3);
      });
    }

    // =============================================================
    // 7. EQUIPMENT & WORKBENCHES (QC Area)
    // =============================================================
    if (layers.equipment) {
      [20, 22].forEach((qy) => {
        const bPos = gridToScreen(13, qy, 0);
        // Table top
        ctx.fillStyle = '#10b981'; // Green ESD Mat
        ctx.fillRect(bPos.x - 12, bPos.y - 14, 24, 7);
        // Legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(bPos.x - 11, bPos.y - 7, 2, 7);
        ctx.fillRect(bPos.x + 9, bPos.y - 7, 2, 7);
        // Monitor
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bPos.x - 4, bPos.y - 22, 8, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bPos.x - 3, bPos.y - 21, 6, 4);
      });
    }

    // =============================================================
    // 8. GUIDANCE ROUTES (Solid active, dashed planned)
    // =============================================================
    if (layers.routes) {
      // Main Arterial Loop
      const p1 = gridToScreen(5, 11);
      const p2 = gridToScreen(15, 11);
      const p3 = gridToScreen(22, 11);
      const p4 = gridToScreen(22, 18);
      const p5 = gridToScreen(15, 18);
      const p6 = gridToScreen(5, 18);

      // Active Glowing Transit Route
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Waypoint Nodes
      [p1, p2, p3, p4].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Planned Route (Dashed)
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p5.x, p5.y);
      ctx.lineTo(p6.x, p6.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Moving Pulse Line on Active Route
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 16]);
      ctx.lineDashOffset = -pulseOffsetRef.current * 24;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // =============================================================
    // 9. SAFETY ZONE (Red dashed boundary around AMR-04 Obstacle)
    // =============================================================
    if (layers.safetyZones) {
      const s1 = gridToScreen(20, 17.5);
      const s2 = gridToScreen(24.5, 17.5);
      const s3 = gridToScreen(24.5, 21.5);
      const s4 = gridToScreen(20, 21.5);

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(s3.x, s3.y);
      ctx.lineTo(s4.x, s4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Caution stripes inside safety zone
      for (let sc = 20.5; sc <= 24; sc += 0.8) {
        const cP1 = gridToScreen(sc, 17.6);
        const cP2 = gridToScreen(sc + 0.6, 21.4);
        ctx.beginPath();
        ctx.moveTo(cP1.x, cP1.y);
        ctx.lineTo(cP2.x, cP2.y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // =============================================================
    // 10. DEPTH-SORTED DRAWABLES (Racks, Forklifts, Robots)
    // =============================================================
    type Drawable =
      | { type: 'rack'; depth: number; data: (typeof mockWarehouseRacks)[0] }
      | { type: 'robot'; depth: number; data: WarehouseRobot };

    const drawables: Drawable[] = [];

    if (layers.racks) {
      mockWarehouseRacks.forEach((rack) => {
        drawables.push({
          type: 'rack',
          depth: rack.gx + rack.gw + rack.gy + rack.gh,
          data: rack,
        });
      });
    }

    if (layers.robots) {
      robots.forEach((robot) => {
        drawables.push({
          type: 'robot',
          depth: robot.gx + robot.gy + 0.5,
          data: robot,
        });
      });
    }

    drawables.sort((a, b) => a.depth - b.depth);

    drawables.forEach((item) => {
      if (item.type === 'rack') {
        const rack = item.data;
        const H = rack.height;
        const numBays = Math.max(Math.floor(rack.gh / 2.2), 2);

        const uprightColor = '#1d4ed8'; // Industrial blue uprights
        const beamColor = '#ea580c'; // Vibrant safety orange load beam

        for (let b = 0; b < numBays; b++) {
          const bayY1 = rack.gy + (b / numBays) * rack.gh;
          const bayY2 = rack.gy + ((b + 1) / numBays) * rack.gh;

          const pBottomL = gridToScreen(rack.gx, bayY2);
          const pBottomR = gridToScreen(rack.gx + rack.gw, bayY2);
          const pBackL = gridToScreen(rack.gx, bayY1);
          const pBackR = gridToScreen(rack.gx + rack.gw, bayY1);

          const tBottomL = { x: pBottomL.x, y: pBottomL.y - H };
          const tBottomR = { x: pBottomR.x, y: pBottomR.y - H };
          const tBackL = { x: pBackL.x, y: pBackL.y - H };
          const tBackR = { x: pBackR.x, y: pBackR.y - H };

          // Semi-transparent shelf backdrop
          ctx.beginPath();
          ctx.moveTo(pBottomL.x, pBottomL.y);
          ctx.lineTo(pBottomR.x, pBottomR.y);
          ctx.lineTo(tBottomR.x, tBottomR.y);
          ctx.lineTo(tBottomL.x, tBottomL.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
          ctx.fill();

          // 4 Vertical steel upright posts
          [
            [pBottomL, tBottomL],
            [pBottomR, tBottomR],
            [pBackL, tBackL],
            [pBackR, tBackR],
          ].forEach(([base, top]) => {
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(top.x, top.y);
            ctx.strokeStyle = uprightColor;
            ctx.lineWidth = 2.2;
            ctx.stroke();
          });

          // End Frame X-bracing on front face
          if (b === 0) {
            ctx.beginPath();
            ctx.moveTo(pBottomL.x, pBottomL.y);
            ctx.lineTo(tBottomR.x, tBottomR.y);
            ctx.moveTo(pBottomR.x, pBottomR.y);
            ctx.lineTo(tBottomL.x, tBottomL.y);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Top canopy beam
          ctx.beginPath();
          ctx.moveTo(tBottomL.x, tBottomL.y);
          ctx.lineTo(tBottomR.x, tBottomR.y);
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Tiers: horizontal beams and stacked inventory cartons
          for (let t = 1; t <= rack.tiers; t++) {
            const tierFrac = t / (rack.tiers + 0.4);
            const curH = H * tierFrac;

            const b1 = { x: pBottomL.x, y: pBottomL.y - curH };
            const b2 = { x: pBottomR.x, y: pBottomR.y - curH };
            const bBack1 = { x: pBackL.x, y: pBackL.y - curH };

            // Horizontal load beam
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.strokeStyle = beamColor;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            // Depth beam
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(bBack1.x, bBack1.y);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Stacked cartons if tier is occupied
            const isOccupied = (rack.occupancy / 100) > (t / (rack.tiers + 0.8));
            if (isOccupied) {
              const midX = (b1.x + b2.x) / 2;
              const midY = (b1.y + b2.y) / 2;
              const boxW = 12;
              const boxH = 9;

              // Pallet wooden base
              ctx.fillStyle = '#b45309';
              ctx.fillRect(midX - 8, midY - 2.5, 16, 2.5);

              // 3D Box colors (Kraft brown, Astra blue, Finished green)
              const colorCycle = (b + t) % 3;
              const boxFront = colorCycle === 0 ? '#d97706' : colorCycle === 1 ? '#2563eb' : '#16a34a';
              const boxTop = colorCycle === 0 ? '#fbbf24' : colorCycle === 1 ? '#60a5fa' : '#4ade80';
              const boxSide = colorCycle === 0 ? '#b45309' : colorCycle === 1 ? '#1d4ed8' : '#15803d';

              // Box Front
              ctx.beginPath();
              ctx.rect(midX - 7, midY - boxH - 2.5, 14, boxH);
              ctx.fillStyle = boxFront;
              ctx.fill();
              ctx.strokeStyle = 'rgba(0,0,0,0.2)';
              ctx.lineWidth = 0.8;
              ctx.stroke();

              // Box Top (Isometric perspective)
              ctx.beginPath();
              ctx.moveTo(midX - 7, midY - boxH - 2.5);
              ctx.lineTo(midX - 3, midY - boxH - 6.5);
              ctx.lineTo(midX + 11, midY - boxH - 6.5);
              ctx.lineTo(midX + 7, midY - boxH - 2.5);
              ctx.closePath();
              ctx.fillStyle = boxTop;
              ctx.fill();
              ctx.stroke();

              // Box Side
              ctx.beginPath();
              ctx.moveTo(midX + 7, midY - boxH - 2.5);
              ctx.lineTo(midX + 11, midY - boxH - 6.5);
              ctx.lineTo(midX + 11, midY - 6.5);
              ctx.lineTo(midX + 7, midY - 2.5);
              ctx.closePath();
              ctx.fillStyle = boxSide;
              ctx.fill();
              ctx.stroke();

              // Barcode / White Label on Box Front
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(midX - 4, midY - boxH + 1, 6, 3.5);
            }
          }
        }
      } else if (item.type === 'robot') {
        const robot = item.data;
        const pos = gridToScreen(robot.gx, robot.gy);
        const isSelected = selectedRobotId === robot.id;

        // Ground Contact Shadow
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 4, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
        ctx.fill();

        // Selection Pulsing Halo Ring
        if (isSelected) {
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 4, 24, 12, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 9;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Charging Halo Ring on AMR-03
        if (robot.status === 'Charging') {
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 4, 22, 11, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Draw Robot Body according to type
        if (robot.type === 'FORKLIFT') {
          const isOrange = robot.id === 'AMR-03';
          const fColor = isOrange ? '#f97316' : '#ef4444';
          const fColorDark = isOrange ? '#ea580c' : '#dc2626';

          // 3D Chassis Base
          ctx.fillStyle = fColor;
          ctx.beginPath();
          ctx.roundRect(pos.x - 10, pos.y - 15, 20, 13, 3);
          ctx.fill();
          ctx.strokeStyle = fColorDark;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Overhead Protective ROPS Safety Cage
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(pos.x - 7, pos.y - 25, 14, 10);

          // Mast & Vertical Rails
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 12, pos.y - 26, 3, 22);
          ctx.fillRect(pos.x - 5, pos.y - 26, 3, 22);

          // Forks holding pallet
          ctx.fillStyle = '#334155';
          ctx.fillRect(pos.x - 18, pos.y - 5, 12, 2.5);

          // Loaded carton on forks
          ctx.fillStyle = '#d97706';
          ctx.fillRect(pos.x - 17, pos.y - 14, 9, 8);

          // Beacon Warning Light
          ctx.fillStyle = isOrange ? '#f59e0b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y - 27, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (robot.id === 'PUDU-001') {
          // Pudu Tugger with Tow Cart
          const rW = 14;
          const rH = 16;

          // Main Tugger Unit
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.roundRect(pos.x - 8, pos.y - rH, 16, rH, 4);
          ctx.fill();

          // Digital Display Screen
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 6, pos.y - rH + 3, 12, 6);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pos.x - 4, pos.y - rH + 4.5, 3, 3);
          ctx.fillRect(pos.x + 1, pos.y - rH + 4.5, 3, 3);

          // Tow Cart Behind
          ctx.fillStyle = '#64748b';
          ctx.fillRect(pos.x + 10, pos.y - 12, 14, 10);
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(pos.x + 11, pos.y - 15, 12, 4);
        } else {
          // Sleek Flatbed AMR (AMR-01, AMR-02)
          const rW = 18;
          const rH = 8;

          // Lower Bumper Chassis
          ctx.beginPath();
          ctx.moveTo(pos.x - rW, pos.y);
          ctx.lineTo(pos.x, pos.y + 4);
          ctx.lineTo(pos.x + rW, pos.y);
          ctx.lineTo(pos.x, pos.y - 4);
          ctx.closePath();
          ctx.fillStyle = '#1e293b';
          ctx.fill();

          // Upper White Deck
          ctx.beginPath();
          ctx.moveTo(pos.x - rW, pos.y - rH);
          ctx.lineTo(pos.x, pos.y + 4 - rH);
          ctx.lineTo(pos.x + rW, pos.y - rH);
          ctx.lineTo(pos.x, pos.y - 4 - rH);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = robot.color;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Astra Blue Status LED Band
          ctx.fillStyle = robot.color;
          ctx.fillRect(pos.x - 12, pos.y - rH + 1, 24, 2);

          // LiDAR Puck Turret
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y - rH - 2, 3, 0, Math.PI * 2);
          ctx.fill();

          // Carried Pallet if running
          if (robot.status === 'Running') {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(pos.x - 9, pos.y - rH - 4, 18, 3);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pos.x - 8, pos.y - rH - 12, 16, 8);
            ctx.strokeStyle = '#d97706';
            ctx.strokeRect(pos.x - 8, pos.y - rH - 12, 16, 8);
          }
        }

        // Floating Status Badge Marker
        const tagY = pos.y - 32;
        ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
        const nameW = ctx.measureText(robot.id).width;
        ctx.font = '8px Inter, -apple-system, sans-serif';
        const statusLabel = robot.status === 'Running' ? 'Moving' : robot.status;
        const statusW = ctx.measureText(statusLabel).width + 8;
        const cardW = Math.max(nameW, statusW) + 18;
        const cardH = 26;

        ctx.save();
        ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(pos.x - cardW / 2, tagY - cardH, cardW, cardH, 6);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = isSelected ? '#2563eb' : '#e2e8f0';
        ctx.lineWidth = isSelected ? 1.8 : 1;
        ctx.stroke();

        // Line 1: Robot ID
        ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(robot.id, pos.x, tagY - cardH + 10.5);

        // Line 2: Status Dot + Status Text
        const line2Y = tagY - cardH + 20.5;
        const totalLine2W = 6 + 3 + ctx.measureText(statusLabel).width;
        const dotX = pos.x - totalLine2W / 2 + 3;

        ctx.beginPath();
        ctx.arc(dotX, line2Y - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = robot.color;
        ctx.fill();

        ctx.font = '8px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(statusLabel, dotX + 6, line2Y);
      }
    });

    ctx.restore();
    ctx.restore();
  }, [camera, robots, layers, selectedRobotId, viewMode, gridToScreen, containerSize]);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && onToggleFullscreen) {
        onToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: isFullscreen ? '100vh' : '530px',
        backgroundColor: '#f8fafc',
        borderRadius: isFullscreen ? 0 : '12px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid #cbd5e1',
        display: 'flex',
      }}
    >
      {/* =========================================================
          LEFT VERTICAL OVERLAY CONTROLS (Zoom, Fullscreen, Floors, Compass)
      ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Zoom, Maximize & Reset Buttons */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.15, 2.5) }))}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />
          <button
            onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.max(prev.zoom * 0.85, 0.35) }))}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />
          <button
            onClick={onToggleFullscreen}
            style={{
              padding: '8px',
              background: isFullscreen ? '#eff6ff' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: isFullscreen ? '#2563eb' : '#475569',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enlarge / Fullscreen Preview'}
          >
            <Maximize2 size={15} />
          </button>
          <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />
          <button
            onClick={resetCamera}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
            title="Reset / Fit View"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Floor Selector (3F, 2F, 1F, GF) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {(['3F', '2F', '1F', 'GF'] as const).map((floor) => {
            const isActive = activeFloor === floor;
            return (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#2563eb' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                }}
              >
                {floor}
              </button>
            );
          })}
        </div>

        {/* Compass Rose */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800,
            color: '#0f172a',
          }}
          title="Compass North"
        >
          <span style={{ color: '#ef4444', marginRight: '2px' }}>▲</span>N
        </div>
      </div>

      {/* =========================================================
          BOTTOM OVERLAY LEGEND
      ========================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '6px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
          <span>Moving</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
          <span>Idle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <span>Charging</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span>Offline / Fault</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '14px', height: '2px', backgroundColor: '#0284c7' }} />
          <span>Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '14px', borderTop: '2px dashed #38bdf8' }} />
          <span>Planned route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '10px', border: '1.5px dashed #ef4444', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '2px' }} />
          <span>Safety zone</span>
        </div>
      </div>

      {/* =========================================================
          MAIN CANVAS ELEMENT
      ========================================================= */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
      />

      {/* =========================================================
          RIGHT FLOATING PANEL: ROBOT DETAILS + MINIMAP
      ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          bottom: '16px',
          width: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Card 1: Robot details */}
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              Robot details
            </span>
            <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <MoreHorizontal size={15} />
            </button>
          </div>

          {/* Hero Row: Vector Avatar + Name + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe',
                flexShrink: 0,
              }}
            >
              {selectedRobot.type === 'FORKLIFT' ? (
                <svg width="36" height="32" viewBox="0 0 44 40" fill="none">
                  <ellipse cx="22" cy="35" rx="16" ry="4" fill="rgba(15,23,42,0.12)" />
                  <path d="M 8 10 L 8 32 M 12 10 L 12 32" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 3 31 L 12 31" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="12" y="18" width="22" height="13" rx="3" fill={selectedRobot.id === 'AMR-03' ? '#f97316' : '#ef4444'} />
                  <path d="M 16 18 L 18 10 L 28 10 L 30 18" stroke="#334155" strokeWidth="2" strokeLinejoin="round" fill="none" />
                  <circle cx="16" cy="32" r="4" fill="#1e293b" />
                  <circle cx="32" cy="32" r="4" fill="#1e293b" />
                </svg>
              ) : selectedRobot.id === 'PUDU-001' ? (
                <svg width="36" height="32" viewBox="0 0 44 40" fill="none">
                  <ellipse cx="22" cy="35" rx="15" ry="3.5" fill="rgba(15,23,42,0.12)" />
                  <rect x="10" y="24" width="24" height="8" rx="3" fill="#1e293b" />
                  <rect x="12" y="14" width="20" height="11" rx="4" fill="#3b82f6" />
                  <rect x="14" y="16" width="16" height="6" rx="2" fill="#0f172a" />
                  <circle cx="18" cy="19" r="1.2" fill="#38bdf8" />
                  <circle cx="26" cy="19" r="1.2" fill="#38bdf8" />
                </svg>
              ) : (
                <svg width="36" height="32" viewBox="0 0 44 40" fill="none">
                  <ellipse cx="22" cy="35" rx="16" ry="4" fill="rgba(15,23,42,0.12)" />
                  <rect x="8" y="24" width="28" height="9" rx="3.5" fill="#1e293b" />
                  <rect x="9" y="18" width="26" height="7" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="12" y="26" width="20" height="2" rx="1" fill="#2563eb" />
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedRobot.id}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5px 7px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor:
                      selectedRobot.status === 'Running'
                        ? '#eff6ff'
                        : selectedRobot.status === 'Charging'
                        ? '#fffbeb'
                        : selectedRobot.status === 'Idle'
                        ? '#f0fdf4'
                        : '#fef2f2',
                    color:
                      selectedRobot.status === 'Running'
                        ? '#2563eb'
                        : selectedRobot.status === 'Charging'
                        ? '#d97706'
                        : selectedRobot.status === 'Idle'
                        ? '#16a34a'
                        : '#dc2626',
                  }}
                >
                  {selectedRobot.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                {selectedRobot.model}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                {selectedRobot.taskType}
              </div>
            </div>
          </div>

          {/* Tabs: Live status / Current task */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              marginTop: '2px',
            }}
          >
            <button
              onClick={() => setActiveTab('live')}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'live' ? '#2563eb' : '#64748b',
                borderBottom: activeTab === 'live' ? '2px solid #2563eb' : 'none',
              }}
            >
              Live status
            </button>
            <button
              onClick={() => setActiveTab('task')}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: activeTab === 'task' ? '#2563eb' : '#64748b',
                borderBottom: activeTab === 'task' ? '2px solid #2563eb' : 'none',
              }}
            >
              Current task
            </button>
          </div>

          {/* Telemetry Metrics or Task Tab Content */}
          {activeTab === 'live' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              {/* Battery */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Battery</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedRobot.battery}%</span>
              </div>

              {/* Speed */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Speed</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (selectedRobot.speed / 1.5) * 100)}%`, height: '100%', backgroundColor: '#0d9488' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedRobot.speed} m/s</span>
                </div>
              </div>

              {/* Load */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Load</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedRobot.load}</span>
              </div>

              {/* Current location */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Current location</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedRobot.currentLocation}</span>
              </div>

              {/* Next waypoint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Next waypoint</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedRobot.nextWaypoint}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mission ID</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedRobot.currentTask}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Task Type</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedRobot.taskType}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Destination</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedRobot.nextWaypoint}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Target ETA</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{selectedRobot.eta}</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', marginBottom: '3px' }}>
                  <span>Mission Progress</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>84%</span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '84%', height: '100%', backgroundColor: '#2563eb' }} />
                </div>
              </div>
            </div>
          )}

          {/* Action Simulation Toast Message */}
          {actionToast && (
            <div
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 600,
                lineHeight: 1.35,
                backgroundColor: actionToast.type === 'success' ? '#ecfdf5' : '#eff6ff',
                color: actionToast.type === 'success' ? '#065f46' : '#1e40af',
                border: `1px solid ${actionToast.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`,
              }}
            >
              {actionToast.message}
            </div>
          )}

          {/* Quick Action Buttons Row: Pause / Reroute / Send to charge */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={handlePauseRobot}
              className="btn-secondary"
              style={{
                padding: '6px 2px',
                fontSize: '10px',
                fontWeight: 600,
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '2px',
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {selectedRobot.status === 'Running' ? <Pause size={12} /> : <Play size={12} />}
              {selectedRobot.status === 'Running' ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleRerouteRobot}
              className="btn-secondary"
              style={{
                padding: '6px 2px',
                fontSize: '10px',
                fontWeight: 600,
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '2px',
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCw size={12} />
              Reroute
            </button>
            <button
              onClick={handleChargeRobot}
              className="btn-secondary"
              style={{
                padding: '6px 2px',
                fontSize: '10px',
                fontWeight: 600,
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '2px',
                cursor: 'pointer',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={12} style={{ color: '#f59e0b' }} />
              Send to charge
            </button>
          </div>
        </div>

        {/* Card 2: Minimap */}
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            onClick={() => setIsMinimapOpen(!isMinimapOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
              Minimap
            </span>
            <ChevronDown
              size={13}
              style={{
                transform: isMinimapOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: '#64748b',
              }}
            />
          </div>

          {isMinimapOpen && (
            <div
              style={{
                width: '100%',
                height: '75px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'crosshair',
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickNormX = (e.clientX - rect.left) / rect.width;
                const clickNormY = (e.clientY - rect.top) / rect.height;
                const targetGx = clickNormX * 33;
                const targetGy = clickNormY * 26;
                const targetPos = gridToScreen(targetGx, targetGy);
                if (containerRef.current) {
                  const cw = containerRef.current.clientWidth;
                  const ch = containerRef.current.clientHeight;
                  setCamera((prev) => ({
                    ...prev,
                    x: (cw - 300) / 2 - targetPos.x * prev.zoom,
                    y: ch / 2 - targetPos.y * prev.zoom,
                  }));
                }
              }}
              title="Minimap - Click to center view"
            >
              {/* Floorplan zones layout in minimap */}
              <div style={{ position: 'absolute', left: '8%', top: '10%', width: '22%', height: '36%', backgroundColor: '#dbeafe', borderRadius: '2px', border: '1px solid #93c5fd' }} />
              <div style={{ position: 'absolute', left: '36%', top: '10%', width: '22%', height: '36%', backgroundColor: '#ede9fe', borderRadius: '2px', border: '1px solid #c4b5fd' }} />
              <div style={{ position: 'absolute', left: '64%', top: '10%', width: '24%', height: '36%', backgroundColor: '#dcfce7', borderRadius: '2px', border: '1px solid #86efac' }} />
              <div style={{ position: 'absolute', left: '32%', top: '52%', width: '18%', height: '34%', backgroundColor: '#fef3c7', borderRadius: '2px', border: '1px solid #fde68a' }} />
              <div style={{ position: 'absolute', left: '56%', top: '52%', width: '22%', height: '34%', backgroundColor: '#fee2e2', borderRadius: '2px', border: '1px solid #fca5a5' }} />
              <div style={{ position: 'absolute', left: '78%', top: '48%', width: '18%', height: '38%', backgroundColor: '#f1f5f9', borderRadius: '2px', border: '1px solid #cbd5e1' }} />

              {/* Dynamic Viewport Frame */}
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.max(2, Math.min(68, 28 - (camera.x / 1400) * 22))}%`,
                  top: `${Math.max(2, Math.min(64, 22 - (camera.y / 900) * 22))}%`,
                  width: `${Math.max(20, Math.min(75, 46 / Math.max(camera.zoom, 0.45)))}%`,
                  height: `${Math.max(20, Math.min(75, 50 / Math.max(camera.zoom, 0.45)))}%`,
                  border: '1.5px solid #2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  borderRadius: '3px',
                  pointerEvents: 'none',
                  transition: 'all 0.1s ease-out',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
