import { createGrid, randomizeObstacles, xyToIndex } from "./grid.js";
import { findPathAStar } from "./pathfinding.js";


export function getMaxAllowedTimeMs(m) {
  if (m < 60) {
    throw new Error("La taille minimale exigée de la grille est 60x60.");
  }
  return 60 + m * Math.log(m / 60);
}


export function runBenchmark({
  m = 60,
  density = 0.2,
  runs = 30,
  pathfinder = findPathAStar,
} = {}) {
  const maxAllowedMs = getMaxAllowedTimeMs(m);
  const startIdx = xyToIndex(0, 0, m);
  const goalIdx = xyToIndex(m - 1, m - 1, m);
  const protectedIndices = new Set([startIdx, goalIdx]);

  let totalTimeMs = 0;
  let maxTimeMs = 0;
  let totalExplored = 0;
  let totalPathLength = 0;
  let solvedCount = 0;

  for (let i = 0; i < runs; i++) {
    const grid = createGrid(m);
    randomizeObstacles(grid, density, protectedIndices);

    const { path, exploredCount, elapsedMs } = pathfinder(
      grid,
      m,
      startIdx,
      goalIdx,
      protectedIndices
    );

    totalTimeMs += elapsedMs;
    if (elapsedMs > maxTimeMs) maxTimeMs = elapsedMs;
    totalExplored += exploredCount;

    if (path.length > 0) {
      solvedCount++;
      totalPathLength += path.length;
    }
  }

  const avgTimeMs = totalTimeMs / runs;
  const avgExplored = Math.round(totalExplored / runs);
  const avgPathLength = solvedCount > 0 ? Math.round(totalPathLength / solvedCount) : 0;

  return {
    m,
    density,
    runs,
    avgTimeMs: Number(avgTimeMs.toFixed(3)),
    maxTimeMs: Number(maxTimeMs.toFixed(3)),
    maxAllowedMs: Number(maxAllowedMs.toFixed(2)),
    withinLimit: avgTimeMs <= maxAllowedMs,
    avgExplored,
    avgPathLength,
    solvedRate: `${solvedCount}/${runs}`,
  };
}