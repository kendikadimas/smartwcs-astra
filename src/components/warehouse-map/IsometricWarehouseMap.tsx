'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  mockIsometricZones,
  mockIsometricRacks,
  mockIsometricRobots,
  mockIsometricChargingBays,
} from '@/data/mockWarehouseMap';
import {
  IsometricRobot,
  MapLayerState,
} from '@/types/warehouseMap';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Layers,
  BatteryCharging,
  Wifi,
  WifiOff,
  Zap,
  Box,
  Truck,
  Activity,
  X,
  Compass,
} from 'lucide-react';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function IsometricWarehouseMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation State
  const [robots, setRobots] = useState<IsometricRobot[]>(mockIsometricRobots);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>('AMR-02');
  const [isFollowingRobot, setIsFollowingRobot] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layers Filter
  const [layers, setLayers] = useState<MapLayerState>({
    racks: true,
    routes: true,
    robots: true,
    chargingBays: true,
    safetyZones: true,
    labels: true,
  });
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Camera State
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const pulseOffsetRef = useRef<number>(0);

  // Isometric Constants (Standard 2:1 projection)
  const TILE_W = 52;
  const TILE_H = 26;

  // Coordinate Conversion: Grid (gx, gy, gz) -> Screen (x, y)
  const gridToScreen = useCallback(
    (gx: number, gy: number, gz = 0) => {
      const sx = (gx - gy) * (TILE_W / 2);
      const sy = (gx + gy) * (TILE_H / 2) - gz;
      return { x: sx, y: sy };
    },
    [TILE_W, TILE_H]
  );

  // Inverse Coordinate Conversion: Screen (x, y) -> Grid (gx, gy)
  const screenToGrid = useCallback(
    (sx: number, sy: number) => {
      const gx = sx / TILE_W + sy / TILE_H;
      const gy = sy / TILE_H - sx / TILE_W;
      return { gx, gy };
    },
    [TILE_W, TILE_H]
  );

  // Center Camera
  const resetCamera = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    // Warehouse center around gx=12, gy=10
    const center = gridToScreen(12, 10);
    setCamera({
      x: clientWidth / 2 - center.x * 1,
      y: clientHeight / 2 - center.y * 1 - 20,
      zoom: 1.05,
    });
    setIsFollowingRobot(false);
  }, [gridToScreen]);

  // Initial Camera setup
  useEffect(() => {
    resetCamera();
  }, [resetCamera]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // only left click
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    if (isFollowingRobot) setIsFollowingRobot(false);
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

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setCamera((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.45), 2.8);
      // Zoom centered on cursor
      const newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom);
      const newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom);
      return { x: newX, y: newY, zoom: newZoom };
    });
  };

  // Click on Canvas: Hit Test for Robots & Racks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Transform click to world space
    const worldX = (clickX - camera.x) / camera.zoom;
    const worldY = (clickY - camera.y) / camera.zoom;

    // Check click against robots
    let clickedRobotId: string | null = null;
    robots.forEach((robot) => {
      const pos = gridToScreen(robot.gx, robot.gy);
      const dist = Math.hypot(worldX - pos.x, worldY - pos.y);
      if (dist < 26) {
        clickedRobotId = robot.id;
      }
    });

    if (clickedRobotId) {
      setSelectedRobotId(clickedRobotId);
    }
  };

  // Simulation Update Loop: Waypoint Navigation for Moving Robots
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      pulseOffsetRef.current = (pulseOffsetRef.current + 0.08) % 1;

      setRobots((prevRobots) =>
        prevRobots.map((robot) => {
          if (robot.status !== 'Moving' || robot.pathWaypoints.length < 2) {
            return robot;
          }

          const target = robot.pathWaypoints[robot.currentWaypointIdx];
          const dx = target.x - robot.gx;
          const dy = target.y - robot.gy;
          const dist = Math.hypot(dx, dy);

          const step = 0.045 * simSpeed;

          if (dist < step) {
            // Reached waypoint, advance to next
            const nextIdx = (robot.currentWaypointIdx + 1) % robot.pathWaypoints.length;
            const nextTarget = robot.pathWaypoints[nextIdx];
            const nextAngle = Math.atan2(nextTarget.y - target.y, nextTarget.x - target.x) * (180 / Math.PI);

            return {
              ...robot,
              gx: target.x,
              gy: target.y,
              currentWaypointIdx: nextIdx,
              headingAngle: nextAngle >= 0 ? nextAngle : nextAngle + 360,
            };
          } else {
            // Interpolate toward target
            const moveX = (dx / dist) * step;
            const moveY = (dy / dist) * step;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return {
              ...robot,
              gx: robot.gx + moveX,
              gy: robot.gy + moveY,
              headingAngle: angle >= 0 ? angle : angle + 360,
            };
          }
        })
      );
    }, 32);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Follow Camera on Selected Robot
  useEffect(() => {
    if (!isFollowingRobot || !selectedRobotId || !containerRef.current) return;
    const robot = robots.find((r) => r.id === selectedRobotId);
    if (!robot) return;

    const screenPos = gridToScreen(robot.gx, robot.gy);
    const { clientWidth, clientHeight } = containerRef.current;

    setCamera((prev) => ({
      ...prev,
      x: clientWidth / 2 - screenPos.x * prev.zoom,
      y: clientHeight / 2 - screenPos.y * prev.zoom,
    }));
  }, [robots, selectedRobotId, isFollowingRobot, gridToScreen]);

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 900;
    const height = canvas.parentElement?.clientHeight || 560;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // ==========================================
    // 1. FLOOR TILES & GRID
    // ==========================================
    const GRID_SIZE = 24;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 1;

    for (let gx = 0; gx <= GRID_SIZE; gx++) {
      for (let gy = 0; gy <= GRID_SIZE; gy++) {
        // Subtle diamond grid
        const p1 = gridToScreen(gx, gy);
        const p2 = gridToScreen(gx + 1, gy);
        const p3 = gridToScreen(gx + 1, gy + 1);
        const p4 = gridToScreen(gx, gy + 1);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // ==========================================
    // 2. WAREHOUSE ZONES (Colored Floor Areas)
    // ==========================================
    if (layers.safetyZones) {
      mockIsometricZones.forEach((zone) => {
        const pTop = gridToScreen(zone.gx, zone.gy);
        const pRight = gridToScreen(zone.gx + zone.gw, zone.gy);
        const pBottom = gridToScreen(zone.gx + zone.gw, zone.gy + zone.gh);
        const pLeft = gridToScreen(zone.gx, zone.gy + zone.gh);

        // Fill Zone
        ctx.beginPath();
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.lineTo(pBottom.x, pBottom.y);
        ctx.lineTo(pLeft.x, pLeft.y);
        ctx.closePath();

        ctx.fillStyle = zone.color;
        ctx.fill();
        ctx.strokeStyle = zone.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Zone Label
        if (layers.labels) {
          const center = gridToScreen(zone.gx + zone.gw / 2, zone.gy + 1);
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillStyle = '#475569';
          ctx.textAlign = 'center';
          ctx.fillText(zone.label, center.x, center.y);
        }
      });
    }

    // ==========================================
    // 3. CHARGING BAYS
    // ==========================================
    if (layers.chargingBays) {
      mockIsometricChargingBays.forEach((bay) => {
        const pTop = gridToScreen(bay.gx, bay.gy);
        const pRight = gridToScreen(bay.gx + 1, bay.gy);
        const pBottom = gridToScreen(bay.gx + 1, bay.gy + 1);
        const pLeft = gridToScreen(bay.gx, bay.gy + 1);

        ctx.beginPath();
        ctx.moveTo(pTop.x, pTop.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.lineTo(pBottom.x, pBottom.y);
        ctx.lineTo(pLeft.x, pLeft.y);
        ctx.closePath();

        ctx.fillStyle = bay.status === 'occupied' ? '#fef3c7' : '#ecfdf5';
        ctx.fill();
        ctx.strokeStyle = bay.status === 'occupied' ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center Bolt Symbol
        const center = gridToScreen(bay.gx + 0.5, bay.gy + 0.5);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = bay.status === 'occupied' ? '#d97706' : '#059669';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${bay.id}`, center.x, center.y + 3);
      });
    }

    // ==========================================
    // 4. AGV GUIDANCE PATHWAYS (Tracks)
    // ==========================================
    if (layers.routes) {
      // Main Arterial Corridor (gy = 15)
      const pStart = gridToScreen(2, 15);
      const pEnd = gridToScreen(22, 15);

      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Connecting feeder lines to RMW, ASSEMBLY, FGW
      [4, 7, 11, 14, 19].forEach((gx) => {
        const pF1 = gridToScreen(gx, 2);
        const pF2 = gridToScreen(gx, 15);
        ctx.beginPath();
        ctx.moveTo(pF1.x, pF1.y);
        ctx.lineTo(pF2.x, pF2.y);
        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Animated Waypoint Pulse for Moving Robots
      robots.forEach((robot) => {
        if (robot.status === 'Moving' && robot.pathWaypoints.length > 1) {
          ctx.beginPath();
          robot.pathWaypoints.forEach((wp, idx) => {
            const pt = gridToScreen(wp.x, wp.y);
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.strokeStyle = robot.color;
          ctx.lineWidth = 2.2;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = -pulseOffsetRef.current * 16;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // ==========================================
    // 5. DEPTH-SORTED DRAWABLE OBJECTS (Racks & Robots)
    // To ensure proper 2.5D occlusion, sort by (gx + gy)
    // ==========================================
    type Drawable =
      | { type: 'rack'; depth: number; data: typeof mockIsometricRacks[0] }
      | { type: 'robot'; depth: number; data: IsometricRobot };

    const drawables: Drawable[] = [];

    if (layers.racks) {
      mockIsometricRacks.forEach((rack) => {
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

    // Sort back-to-front
    drawables.sort((a, b) => a.depth - b.depth);

    // Render drawables
    drawables.forEach((item) => {
      if (item.type === 'rack') {
        const rack = item.data;
        const H = rack.height;

        // Base 4 points on floor
        const bTop = gridToScreen(rack.gx, rack.gy);
        const bRight = gridToScreen(rack.gx + rack.gw, rack.gy);
        const bBottom = gridToScreen(rack.gx + rack.gw, rack.gy + rack.gh);
        const bLeft = gridToScreen(rack.gx, rack.gy + rack.gh);

        // Top 4 points elevated by H
        const tTop = { x: bTop.x, y: bTop.y - H };
        const tRight = { x: bRight.x, y: bRight.y - H };
        const tBottom = { x: bBottom.x, y: bBottom.y - H };
        const tLeft = { x: bLeft.x, y: bLeft.y - H };

        // Left Face (Facing South-West)
        ctx.beginPath();
        ctx.moveTo(bLeft.x, bLeft.y);
        ctx.lineTo(bBottom.x, bBottom.y);
        ctx.lineTo(tBottom.x, tBottom.y);
        ctx.lineTo(tLeft.x, tLeft.y);
        ctx.closePath();
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right Face (Facing South-East)
        ctx.beginPath();
        ctx.moveTo(bRight.x, bRight.y);
        ctx.lineTo(bBottom.x, bBottom.y);
        ctx.lineTo(tBottom.x, tBottom.y);
        ctx.lineTo(tRight.x, tRight.y);
        ctx.closePath();
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top Face
        ctx.beginPath();
        ctx.moveTo(tTop.x, tTop.y);
        ctx.lineTo(tRight.x, tRight.y);
        ctx.lineTo(tBottom.x, tBottom.y);
        ctx.lineTo(tLeft.x, tLeft.y);
        ctx.closePath();
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Shelf Tier Lines & Colored Pallets on Left Face
        for (let t = 1; t <= rack.tiers; t++) {
          const tierFraction = t / (rack.tiers + 1);
          const tierH = H * tierFraction;

          const p1 = { x: bLeft.x, y: bLeft.y - tierH };
          const p2 = { x: bBottom.x, y: bBottom.y - tierH };

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Pallet Box on shelf if occupied
          if (rack.occupancy > t * 18) {
            ctx.fillStyle = rack.color;
            ctx.fillRect((p1.x + p2.x) / 2 - 4, (p1.y + p2.y) / 2 - 5, 8, 4);
          }
        }
      } else if (item.type === 'robot') {
        const robot = item.data;
        const pos = gridToScreen(robot.gx, robot.gy);
        const isSelected = selectedRobotId === robot.id;

        // Shadow under robot
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 4, 14, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        ctx.fill();

        // Selection Ring
        if (isSelected) {
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y + 4, 22, 11, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // 3D Isometric AMR Chassis Body
        const rW = 18;
        const rH = 8; // chassis height

        // Chassis Bottom
        const cbTop = { x: pos.x, y: pos.y - 4 };
        const cbRight = { x: pos.x + rW, y: pos.y };
        const cbBottom = { x: pos.x, y: pos.y + 4 };
        const cbLeft = { x: pos.x - rW, y: pos.y };

        // Chassis Top (Elevated)
        const ctTop = { x: cbTop.x, y: cbTop.y - rH };
        const ctRight = { x: cbRight.x, y: cbRight.y - rH };
        const ctBottom = { x: cbBottom.x, y: cbBottom.y - rH };
        const ctLeft = { x: cbLeft.x, y: cbLeft.y - rH };

        // Left Face
        ctx.beginPath();
        ctx.moveTo(cbLeft.x, cbLeft.y);
        ctx.lineTo(cbBottom.x, cbBottom.y);
        ctx.lineTo(ctBottom.x, ctBottom.y);
        ctx.lineTo(ctLeft.x, ctLeft.y);
        ctx.closePath();
        ctx.fillStyle = '#334155';
        ctx.fill();

        // Right Face
        ctx.beginPath();
        ctx.moveTo(cbRight.x, cbRight.y);
        ctx.lineTo(cbBottom.x, cbBottom.y);
        ctx.lineTo(ctBottom.x, ctBottom.y);
        ctx.lineTo(ctRight.x, ctRight.y);
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Top Face (White/Clean AMR Deck)
        ctx.beginPath();
        ctx.moveTo(ctTop.x, ctTop.y);
        ctx.lineTo(ctRight.x, ctRight.y);
        ctx.lineTo(ctBottom.x, ctBottom.y);
        ctx.lineTo(ctLeft.x, ctLeft.y);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center Status LED Beacon
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - rH - 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = robot.color;
        ctx.fill();
        ctx.shadowColor = robot.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Carried Cargo Pallet (if payload exists)
        if (robot.payload) {
          const boxH = 9;
          const bY = pos.y - rH - 3;
          ctx.beginPath();
          ctx.moveTo(pos.x, bY - 8);
          ctx.lineTo(pos.x + 10, bY - 4);
          ctx.lineTo(pos.x, bY);
          ctx.lineTo(pos.x - 10, bY - 4);
          ctx.closePath();
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pallet side
          ctx.beginPath();
          ctx.moveTo(pos.x - 10, bY - 4);
          ctx.lineTo(pos.x, bY);
          ctx.lineTo(pos.x, bY + boxH);
          ctx.lineTo(pos.x - 10, bY + boxH - 4);
          ctx.closePath();
          ctx.fillStyle = '#d97706';
          ctx.fill();
        }

        // Floating Robot Name Tag
        if (layers.labels) {
          const tagY = pos.y - rH - (robot.payload ? 18 : 10);
          ctx.font = 'bold 10px Inter, sans-serif';
          const textWidth = ctx.measureText(robot.id).width;

          // Tag background pill
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(pos.x - textWidth / 2 - 5, tagY - 11, textWidth + 10, 14, 4);
          ctx.fill();

          // Tag text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(robot.id, pos.x, tagY);
        }
      }
    });

    ctx.restore();
    ctx.restore();
  }, [camera, robots, layers, selectedRobotId, gridToScreen]);

  const selectedRobot = robots.find((r) => r.id === selectedRobotId);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '620px',
        backgroundColor: '#f8fafc',
        borderRadius: isFullscreen ? '0px' : '14px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ========================================================
          TOP FLOATING CONTROL BAR
      ======================================================== */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '18px',
          right: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Left: Map Title & Status */}
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '8px 14px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Warehouse 2.5D Digital Twin</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: '#ecfdf5',
                  color: '#15803d',
                  padding: '1.5px 6px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                }}
              >
                ● 60 FPS Live
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Main Warehouse · Ground Floor Topological Matrix
            </div>
          </div>
        </div>

        {/* Right: Camera & Layer Controls */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Layer Filter Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="btn-secondary"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(8px)',
                padding: '7px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Layers size={14} />
              Layers
            </button>

            {isLayerMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  zIndex: 30,
                  minWidth: '170px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {(
                  [
                    { key: 'racks', label: 'Racks & Pallets' },
                    { key: 'routes', label: 'AGV Pathways' },
                    { key: 'robots', label: 'Robot Fleet' },
                    { key: 'chargingBays', label: 'Charging Bays' },
                    { key: 'safetyZones', label: 'Zone Overlays' },
                    { key: 'labels', label: 'ID Tags & Labels' },
                  ] as const
                ).map((layer) => (
                  <label
                    key={layer.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      color: '#334155',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={layers[layer.key]}
                      onChange={(e) =>
                        setLayers((prev) => ({ ...prev, [layer.key]: e.target.checked }))
                      }
                      style={{ accentColor: '#2563eb' }}
                    />
                    <span>{layer.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Simulation Play / Pause & Speed */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isPlaying ? '#2563eb' : '#64748b',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button
              onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1)}
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                backgroundColor: '#eff6ff',
                padding: '2px 6px',
                cursor: 'pointer',
              }}
              title="Simulation speed"
            >
              {simSpeed}x
            </button>
          </div>

          {/* Zoom & Camera Buttons */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <button
              onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 2.8) }))}
              style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: '#475569' }}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setCamera((prev) => ({ ...prev, zoom: Math.max(prev.zoom * 0.8, 0.45) }))}
              style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: '#475569' }}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetCamera}
              style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: '#475569' }}
              title="Reset View"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={toggleFullscreen}
              style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: '#475569' }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN CANVAS
      ======================================================== */}
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
          flex: 1,
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
      />

      {/* ========================================================
          BOTTOM FLEET SUMMARY BAR & QUICK SELECTOR
      ======================================================== */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '6px 12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Quick Select:</span>
          {robots.map((r) => {
            const isSel = selectedRobotId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRobotId(r.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSel ? `1.5px solid ${r.color}` : '1px solid #e2e8f0',
                  backgroundColor: isSel ? '#ffffff' : '#f8fafc',
                  color: isSel ? r.color : '#475569',
                  boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: r.color,
                  }}
                />
                {r.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          RIGHT FLOATING TELEMETRY INSPECTOR (When robot selected)
      ======================================================== */}
      {selectedRobot && (
        <div
          style={{
            position: 'absolute',
            top: '74px',
            right: '18px',
            width: '290px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '14px 16px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: `${selectedRobot.color}18`,
                  color: selectedRobot.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Truck size={17} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedRobot.name}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>{selectedRobot.model}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedRobotId(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '2px',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Status & Battery Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '8px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              fontSize: '11px',
            }}
          >
            <div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>STATUS</div>
              <div style={{ fontWeight: 700, color: selectedRobot.color, marginTop: '2px' }}>
                {selectedRobot.status}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>BATTERY</div>
              <div style={{ fontWeight: 700, color: selectedRobot.battery <= 20 ? '#dc2626' : '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BatteryCharging size={13} style={{ color: '#16a34a' }} />
                {selectedRobot.battery}%
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>SPEED</div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {selectedRobot.speed} m/s
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>LINK</div>
              <div style={{ fontWeight: 700, color: selectedRobot.linkStatus === 'Online' ? '#16a34a' : '#dc2626', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {selectedRobot.linkStatus === 'Online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                {selectedRobot.linkStatus}
              </div>
            </div>
          </div>

          {/* Current Mission */}
          {selectedRobot.currentTask ? (
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>CURRENT TASK</div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {selectedRobot.currentTask}
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                {selectedRobot.source} → {selectedRobot.destination}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
              No active mission assigned
            </div>
          )}

          {/* Payload Info */}
          {selectedRobot.payload && (
            <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', padding: '6px 8px' }}>
              <div style={{ fontSize: '10px', color: '#854d0e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Box size={12} />
                PAYLOAD: {selectedRobot.payload.id}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#713f12', marginTop: '1px' }}>
                {selectedRobot.payload.name} ({selectedRobot.payload.weightKg} kg)
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={() => setIsFollowingRobot(!isFollowingRobot)}
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                justifyContent: 'center',
                backgroundColor: isFollowingRobot ? '#eff6ff' : '#ffffff',
                borderColor: isFollowingRobot ? '#93c5fd' : '#cbd5e1',
                color: isFollowingRobot ? '#2563eb' : '#334155',
              }}
            >
              <Activity size={12} />
              {isFollowingRobot ? 'Following' : 'Follow'}
            </button>

            <button
              onClick={() => {
                setRobots((prev) =>
                  prev.map((r) =>
                    r.id === selectedRobot.id
                      ? { ...r, status: r.status === 'Moving' ? 'Idle' : 'Moving' }
                      : r
                  )
                );
              }}
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                justifyContent: 'center',
              }}
            >
              {selectedRobot.status === 'Moving' ? 'Hold / Pause' : 'Resume'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
