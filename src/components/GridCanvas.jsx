import React, { useEffect, useRef, useState } from "react";
import { CELL, indexToXY, xyToIndex } from "../engine/grid.js";

export default function GridCanvas({
  grid,
  m = 60,
  startIdx,
  goalIdx,
  robotIdx,
  path = [],
  trail = [],
  onToggleObstacle,
  canvasSize = 740,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(true);

  const cellSize = canvasSize / m;

  function drawRobot(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);

    const r = Math.max(5.5, size * 0.52);

    
    const glow = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 2.1);
    glow.addColorStop(0, "rgba(56, 189, 248, 0.65)");
    glow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = Math.max(1.8, r * 0.18);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(0, -r * 1.45);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(0, -r * 1.52, Math.max(2.6, r * 0.26), 0, Math.PI * 2);
    ctx.fill();

 
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(-r * 1.25, -r * 0.3, r * 0.28, r * 0.6);
    ctx.fillRect(r * 0.97, -r * 0.3, r * 0.28, r * 0.6);

    
    const headW = r * 1.95;
    const headH = r * 1.65;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.beginPath();
    ctx.roundRect(-headW / 2, -headH / 2, headW, headH, r * 0.45);
    ctx.fill();
    ctx.stroke();

   
    const visorW = headW * 0.8;
    const visorH = headH * 0.5;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-visorW / 2, -visorH / 2 - r * 0.04, visorW, visorH, r * 0.22);
    ctx.fill();

    
    ctx.fillStyle = "#22d3ee";
    const eyeX = visorW * 0.24;
    const eyeR = Math.max(1.8, r * 0.22);
    ctx.beginPath();
    ctx.arc(-eyeX, -r * 0.04, eyeR, 0, Math.PI * 2);
    ctx.arc(eyeX, -r * 0.04, eyeR, 0, Math.PI * 2);
    ctx.fill();

   
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = Math.max(1.2, r * 0.14);
    ctx.beginPath();
    ctx.moveTo(-visorW * 0.2, r * 0.45);
    ctx.lineTo(visorW * 0.2, r * 0.45);
    ctx.stroke();

    ctx.restore();
  }

  function drawGoal(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    const r = Math.max(5.5, size * 0.5);

    const glow = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 2.1);
    glow.addColorStop(0, "rgba(16, 185, 129, 0.65)");
    glow.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = Math.max(2, r * 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#6ee7b7";
    ctx.lineWidth = Math.max(1.4, r * 0.14);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ecfdf5";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2.2, r * 0.24), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

   
    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    
    ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= m; i++) {
      const pos = i * cellSize;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvasSize);
      ctx.moveTo(0, pos);
      ctx.lineTo(canvasSize, pos);
    }
    ctx.stroke();

    
    if (trail && trail.length > 0) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
      for (const idx of trail) {
        const { x, y } = indexToXY(idx, m);
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

   
    const pad = Math.max(0.7, cellSize * 0.1);
    const obsSize = Math.max(2, cellSize - pad * 2);
    const obsRadius = Math.min(4, obsSize * 0.25);

    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === CELL.OBSTACLE) {
        const { x, y } = indexToXY(i, m);
        const px = x * cellSize + pad;
        const py = y * cellSize + pad;

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.roundRect(px, py, obsSize, obsSize, obsRadius);
        ctx.fill();

        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    
    if (path && path.length > 1) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = Math.max(5, cellSize * 0.65);
      ctx.beginPath();
      path.forEach((idx, step) => {
        const { x, y } = indexToXY(idx, m);
        const cx = (x + 0.5) * cellSize;
        const cy = (y + 0.5) * cellSize;
        if (step === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = Math.max(2.6, cellSize * 0.32);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Cible
    if (goalIdx != null) {
      const g = indexToXY(goalIdx, m);
      drawGoal(ctx, (g.x + 0.5) * cellSize, (g.y + 0.5) * cellSize, cellSize);
    }

    // 7. Robot
    if (robotIdx != null) {
      const r = indexToXY(robotIdx, m);
      drawRobot(ctx, (r.x + 0.5) * cellSize, (r.y + 0.5) * cellSize, cellSize);
    }
  }, [grid, m, startIdx, goalIdx, robotIdx, path, trail, canvasSize, cellSize]);

  function getCellIndexFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * m);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * m);
    if (x < 0 || x >= m || y < 0 || y >= m) return null;
    return xyToIndex(x, y, m);
  }

  function handleMouseDown(e) {
    const idx = getCellIndexFromEvent(e);
    if (idx === null || idx === startIdx || idx === goalIdx || idx === robotIdx) return;
    const shouldBlock = grid[idx] === CELL.FREE;
    setIsDrawing(true);
    setDrawMode(shouldBlock);
    onToggleObstacle?.(idx, shouldBlock);
  }

  function handleMouseMove(e) {
    if (!isDrawing) return;
    const idx = getCellIndexFromEvent(e);
    if (idx === null || idx === startIdx || idx === goalIdx || idx === robotIdx) return;
    onToggleObstacle?.(idx, drawMode);
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  return (
    <div
      style={{
        display: "inline-block",
        padding: "14px",
        borderRadius: "18px",
        background: "linear-gradient(145deg, #0f172a, #020617)",
        boxShadow: "0 20px 50px rgba(2, 6, 23, 0.75)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          maxWidth: "85vw",
          maxHeight: "85vw",
          display: "block",
          borderRadius: "12px",
          cursor: "crosshair",
        }}
      />
    </div>
  );
}