import React, { useEffect, useMemo, useRef, useState } from "react";
import GridCanvas from "./GridCanvas.jsx";
import {
  clearAroundStartAndGoal,
  clearGrid,
  createGrid,
  isObstacle,
  randomizeObstacles,
  setObstacle,
  xyToIndex,
} from "../engine/grid.js";
import { findPathByLevel } from "../engine/pathfinding.js";
import { getMaxAllowedTimeMs, runBenchmark } from "../engine/benchmark.js";

const LEVEL_HEADER = {
  1: {
    label: "Niveau 1 • Obstacles fixes",
    hint: "Dessine ou efface des obstacles à la souris, puis clique sur Démarrer.",
  },
  2: {
    label: "Niveau 2 • Obstacles dynamiques",
    hint: "Des obstacles apparaissent/disparaissent pendant le trajet et le chemin se met à jour.",
  },
  3: {
    label: "Niveau 3 • Plus court chemin & sélection dynamique",
    hint: "Optimisation sous contrainte T(m) avec sélection dynamique de stratégie.",
  },
};

export default function LevelScreen({ level, onBackToHome }) {
  const [m, setM] = useState(60);
  const [density, setDensity] = useState(0.06);
  const [dynamicRate, setDynamicRate] = useState(0.15);
  const [stepMs, setStepMs] = useState(40);

  const startIdx = useMemo(() => xyToIndex(0, 0, m), [m]);
  const goalIdx = useMemo(() => xyToIndex(m - 1, m - 1, m), [m]);
  const protectedIndices = useMemo(() => new Set([startIdx, goalIdx]), [startIdx, goalIdx]);

  const [grid, setGrid] = useState(() => {
    const g = createGrid(60);
    const s = xyToIndex(0, 0, 60);
    const gl = xyToIndex(59, 59, 60);
    randomizeObstacles(g, 0.06, new Set([s, gl]));
    clearAroundStartAndGoal(g, 60, s, gl);
    return g;
  });

  const [robotIdx, setRobotIdx] = useState(startIdx);
  const [path, setPath] = useState([]);
  const [trail, setTrail] = useState([startIdx]);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Prêt");
  const [metrics, setMetrics] = useState({
    elapsedMs: 0,
    exploredCount: 0,
    strategyUsed: "—",
  });
  const [benchResult, setBenchResult] = useState(null);

  const gridRef = useRef(grid);
  const pathRef = useRef(path);
  const robotRef = useRef(robotIdx);
  gridRef.current = grid;
  pathRef.current = path;
  robotRef.current = robotIdx;

  const maxAllowedMs = useMemo(() => getMaxAllowedTimeMs(m), [m]);

  function computeRoute(currentGrid, fromIdx, isRecalculation = false) {
    const res = findPathByLevel({
      level,
      grid: currentGrid,
      m,
      startIdx: fromIdx,
      goalIdx,
      protectedIndices,
      isRecalculation,
      obstacleDensity: density,
    });

    setPath(res.path);
    pathRef.current = res.path;

    setMetrics({
      elapsedMs: Number(res.elapsedMs.toFixed(3)),
      exploredCount: res.exploredCount,
      strategyUsed: res.strategyUsed,
    });

    if (!res.path || res.path.length === 0) {
      setStatusMsg(
        `Aucun chemin (${res.exploredCount} cases explorées). Clique sur "Grille vide" ou libère un passage.`
      );
    } else {
      setStatusMsg(`Chemin trouvé (${res.path.length} cases) — ${res.strategyUsed}`);
    }

    return res.path;
  }

  function applyGridAndCompute(nextGrid, resetRobotToStart = true) {
    setIsRunning(false);
    const targetRobot = resetRobotToStart ? startIdx : robotRef.current;
    setGrid(nextGrid);
    gridRef.current = nextGrid;
    setRobotIdx(targetRobot);
    robotRef.current = targetRobot;
    setTrail([targetRobot]);
    setBenchResult(null);
    return computeRoute(nextGrid, targetRobot, false);
  }

  function resetLevel(nextM = m, nextDensity = density) {
    const g = createGrid(nextM);
    const sIdx = xyToIndex(0, 0, nextM);
    const gIdx = xyToIndex(nextM - 1, nextM - 1, nextM);
    randomizeObstacles(g, nextDensity, new Set([sIdx, gIdx]));
    clearAroundStartAndGoal(g, nextM, sIdx, gIdx);

    setIsRunning(false);
    setGrid(g);
    gridRef.current = g;
    setRobotIdx(sIdx);
    robotRef.current = sIdx;
    setTrail([sIdx]);
    setBenchResult(null);

    const res = findPathByLevel({
      level,
      grid: g,
      m: nextM,
      startIdx: sIdx,
      goalIdx: gIdx,
      protectedIndices: new Set([sIdx, gIdx]),
      isRecalculation: false,
      obstacleDensity: nextDensity,
    });

    setPath(res.path);
    pathRef.current = res.path;
    setMetrics({
      elapsedMs: Number(res.elapsedMs.toFixed(3)),
      exploredCount: res.exploredCount,
      strategyUsed: res.strategyUsed,
    });
    setStatusMsg(
      res.path.length > 0
        ? `Chemin prêt (${res.path.length} cases). Clique sur Démarrer.`
        : "Aucun chemin initial — clique sur Grille vide ou Nouvelle grille."
    );
  }

  function handleClearGrid() {
    const g = createGrid(m);
    clearGrid(g);
    applyGridAndCompute(g, true);
  }

  useEffect(() => {
    resetLevel(m, density);
    
  }, [m, level]);

  function handleToggleObstacle(idx, shouldBlock) {
    if (idx === startIdx || idx === goalIdx || idx === robotRef.current) return;

    const nextGrid = new Uint8Array(gridRef.current);
    setObstacle(nextGrid, idx, shouldBlock);
    setGrid(nextGrid);
    gridRef.current = nextGrid;

    if (level >= 2 || !isRunning) {
      computeRoute(nextGrid, robotRef.current, isRunning);
    }
  }

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const currentRobot = robotRef.current;
      const workingGrid = new Uint8Array(gridRef.current);
      let currentPath = [...pathRef.current];
      let gridChanged = false;
      let pathBlocked = false;

      if (currentRobot === goalIdx) {
        setIsRunning(false);
        setStatusMsg("Destination atteinte !");
        return;
      }

      if (level >= 2 && Math.random() < dynamicRate) {
        const randIdx = Math.floor(Math.random() * (m * m));
        if (!protectedIndices.has(randIdx) && randIdx !== currentRobot) {
          const willBlock = !isObstacle(workingGrid, randIdx);
          setObstacle(workingGrid, randIdx, willBlock);
          gridChanged = true;

          if (currentPath.includes(randIdx)) {
            pathBlocked = true;
          }
        }
      }

      if (currentPath.length <= 1 || pathBlocked) {
        currentPath = computeRoute(workingGrid, currentRobot, true);
      }

      if (!currentPath || currentPath.length <= 1) {
        setIsRunning(false);
        setStatusMsg("Chemin bloqué — impossible d'atteindre la cible.");
        if (gridChanged) {
          setGrid(workingGrid);
          gridRef.current = workingGrid;
        }
        return;
      }

      const posInPath = currentPath.indexOf(currentRobot);
      let nextStep = posInPath >= 0 ? currentPath[posInPath + 1] : currentPath[1];

      if (nextStep == null || isObstacle(workingGrid, nextStep)) {
        currentPath = computeRoute(workingGrid, currentRobot, true);
        const rePos = currentPath.indexOf(currentRobot);
        nextStep = rePos >= 0 ? currentPath[rePos + 1] : currentPath[1];
      }

      if (nextStep == null || isObstacle(workingGrid, nextStep)) {
        setIsRunning(false);
        setStatusMsg("Aucun passage disponible.");
        return;
      }

      if (gridChanged) {
        setGrid(workingGrid);
        gridRef.current = workingGrid;
      }

      const trimmedPath = currentPath.slice(currentPath.indexOf(nextStep));
      setPath(trimmedPath);
      pathRef.current = trimmedPath;

      setRobotIdx(nextStep);
      robotRef.current = nextStep;
      setTrail((prev) => [...prev, nextStep]);
      setStatusMsg(`En cours... (${trimmedPath.length - 1} pas restants)`);

      if (nextStep === goalIdx) {
        setIsRunning(false);
        setStatusMsg("Destination atteinte !");
      }
    }, stepMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, level, m, goalIdx, dynamicRate, stepMs, protectedIndices]);

  function handleRunBenchmark() {
    const res = runBenchmark({
      m,
      density,
      runs: 25,
      pathfinder: (g, dim, s, gl, prot) =>
        findPathByLevel({
          level,
          grid: g,
          m: dim,
          startIdx: s,
          goalIdx: gl,
          protectedIndices: prot,
          isRecalculation: false,
          obstacleDensity: density,
        }),
    });
    setBenchResult(res);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.45rem" }}>{LEVEL_HEADER[level].label}</h1>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
            {LEVEL_HEADER[level].hint}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToHome}
          style={{
            padding: "9px 15px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#e2e8f0",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Retour aux niveaux
        </button>
      </header>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
        <GridCanvas
          grid={grid}
          m={m}
          startIdx={startIdx}
          goalIdx={goalIdx}
          robotIdx={robotIdx}
          path={path}
          trail={trail}
          onToggleObstacle={handleToggleObstacle}
          canvasSize={740}
        />

        <aside
          style={{
            flex: "1 1 320px",
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                if (robotIdx === goalIdx) {
                  resetLevel(m, density);
                  setIsRunning(true);
                  return;
                }
                const currentP =
                  pathRef.current.length > 1
                    ? pathRef.current
                    : computeRoute(gridRef.current, robotRef.current, false);
                if (!currentP || currentP.length <= 1) return;
                setIsRunning((prev) => !prev);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: isRunning ? "#f59e0b" : "#10b981",
                color: "#020617",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isRunning ? "Pause" : "Démarrer"}
            </button>

            <button
              type="button"
              onClick={() => resetLevel(m, density)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#f8fafc",
                cursor: "pointer",
              }}
            >
              Nouvelle grille
            </button>

            <button
              type="button"
              onClick={handleClearGrid}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #475569",
                background: "transparent",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              Grille vide
            </button>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.88rem" }}>
            Taille de la grille : <strong>{m} × {m}</strong>
            <input
              type="range"
              min={60}
              max={120}
              step={10}
              value={m}
              onChange={(e) => setM(Number(e.target.value))}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.88rem" }}>
            Densité d'obstacles : <strong>{Math.round(density * 100)}%</strong>
            <input
              type="range"
              min={0.02}
              max={0.25}
              step={0.01}
              value={density}
              onChange={(e) => {
                const nextD = Number(e.target.value);
                setDensity(nextD);
                resetLevel(m, nextD);
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.88rem" }}>
            Vitesse du robot : <strong>{stepMs} ms / case</strong>
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={stepMs}
              onChange={(e) => setStepMs(Number(e.target.value))}
            />
          </label>

          {level >= 2 && (
            <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.88rem" }}>
              Fréquence obstacles dynamiques : <strong>{Math.round(dynamicRate * 100)}%</strong>
              <input
                type="range"
                min={0.05}
                max={0.7}
                step={0.05}
                value={dynamicRate}
                onChange={(e) => setDynamicRate(Number(e.target.value))}
              />
            </label>
          )}

          <div
            style={{
              background: "#020617",
              borderRadius: "12px",
              padding: "14px",
              border: "1px solid #1e293b",
              fontSize: "0.86rem",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div><strong>État :</strong> {statusMsg}</div>
            <div>
              <strong>Dernier calcul :</strong> {metrics.elapsedMs} ms (Limite T({m}) :{" "}
              {maxAllowedMs.toFixed(2)} ms)
            </div>
            <div><strong>Cases explorées :</strong> {metrics.exploredCount}</div>
            {level === 3 && (
              <div><strong>Stratégie dynamique :</strong> {metrics.strategyUsed}</div>
            )}
          </div>

          {level === 3 && (
            <>
              <button
                type="button"
                onClick={handleRunBenchmark}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #38bdf8",
                  background: "transparent",
                  color: "#38bdf8",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Lancer Benchmark (25 essais en {m}×{m})
              </button>

              {benchResult && (
                <div
                  style={{
                    background: "#020617",
                    borderRadius: "12px",
                    padding: "12px",
                    border: `1px solid ${benchResult.withinLimit ? "#10b981" : "#ef4444"}`,
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                  }}
                >
                  <div>
                    <strong>Moyenne :</strong> {benchResult.avgTimeMs} ms /{" "}
                    {benchResult.maxAllowedMs} ms ({benchResult.withinLimit ? "OK" : "HORS LIMITE"})
                  </div>
                  <div>
                    <strong>Max :</strong> {benchResult.maxTimeMs} ms | <strong>Résolus :</strong>{" "}
                    {benchResult.solvedRate}
                  </div>
                  <div>
                    <strong>Explorées (moy.) :</strong> {benchResult.avgExplored} |{" "}
                    <strong>Longueur (moy.) :</strong> {benchResult.avgPathLength}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}