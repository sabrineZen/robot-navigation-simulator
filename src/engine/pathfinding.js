import { MinHeap } from "./minHeap.js";
import { getWalkableNeighbors, indexToXY } from "./grid.js";


export function manhattanDistance(idxA, idxB, m) {
  const a = indexToXY(idxA, m);
  const b = indexToXY(idxB, m);
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}


function reconstructPath(parent, startIdx, goalIdx) {
  if (startIdx === goalIdx) return [startIdx];
  if (parent[goalIdx] === -1) return [];

  const path = [];
  let curr = goalIdx;

  while (curr !== -1) {
    path.push(curr);
    if (curr === startIdx) break;
    curr = parent[curr];
  }

  if (path[path.length - 1] !== startIdx) {
    return [];
  }

  path.reverse();
  return path;
}


export function findPathAStar(grid, m, startIdx, goalIdx) {
  const t0 = performance.now();
  const totalCells = m * m;

  if (
    startIdx < 0 ||
    startIdx >= totalCells ||
    goalIdx < 0 ||
    goalIdx >= totalCells
  ) {
    return { path: [], exploredCount: 0, elapsedMs: performance.now() - t0 };
  }

  if (startIdx === goalIdx) {
    return { path: [startIdx], exploredCount: 1, elapsedMs: performance.now() - t0 };
  }

  
  const gScore = new Float64Array(totalCells);
  gScore.fill(Infinity);
  gScore[startIdx] = 0;


  const parent = new Int32Array(totalCells);
  parent.fill(-1);

 
  const closed = new Uint8Array(totalCells);

  const openSet = new MinHeap();
  openSet.push(startIdx, manhattanDistance(startIdx, goalIdx, m));

  let exploredCount = 0;

  while (!openSet.isEmpty()) {
    const current = openSet.pop();

    if (closed[current]) continue;
    closed[current] = 1;
    exploredCount++;

    if (current === goalIdx) {
      const path = reconstructPath(parent, startIdx, goalIdx);
      return {
        path,
        exploredCount,
        elapsedMs: performance.now() - t0,
      };
    }

    const neighbors = getWalkableNeighbors(grid, current, m);
    const tentativeG = gScore[current] + 1;

    for (const nextIdx of neighbors) {
      if (closed[nextIdx]) continue;

      if (tentativeG < gScore[nextIdx]) {
        parent[nextIdx] = current;
        gScore[nextIdx] = tentativeG;
        const fScore = tentativeG + manhattanDistance(nextIdx, goalIdx, m);
        openSet.push(nextIdx, fScore);
      }
    }
  }

  return {
    path: [],
    exploredCount,
    elapsedMs: performance.now() - t0,
  };
}


export function findLocalPath(grid, m, startIdx, goalIdx, maxExpanded = 1800) {
  const t0 = performance.now();
  const totalCells = m * m;

  if (startIdx === goalIdx) {
    return { path: [startIdx], exploredCount: 1, elapsedMs: performance.now() - t0, exhausted: false };
  }

  const gScore = new Float64Array(totalCells);
  gScore.fill(Infinity);
  gScore[startIdx] = 0;

  const parent = new Int32Array(totalCells);
  parent.fill(-1);

  const closed = new Uint8Array(totalCells);
  const openSet = new MinHeap();
  openSet.push(startIdx, manhattanDistance(startIdx, goalIdx, m));

  let exploredCount = 0;

  while (!openSet.isEmpty()) {
    if (exploredCount >= maxExpanded) {
      return {
        path: [],
        exploredCount,
        elapsedMs: performance.now() - t0,
        exhausted: true, 
      };
    }

    const current = openSet.pop();
    if (closed[current]) continue;
    closed[current] = 1;
    exploredCount++;

    if (current === goalIdx) {
      return {
        path: reconstructPath(parent, startIdx, goalIdx),
        exploredCount,
        elapsedMs: performance.now() - t0,
        exhausted: false,
      };
    }

    const neighbors = getWalkableNeighbors(grid, current, m);
    const tentativeG = gScore[current] + 1;

    for (const nextIdx of neighbors) {
      if (closed[nextIdx]) continue;
      if (tentativeG < gScore[nextIdx]) {
        parent[nextIdx] = current;
        gScore[nextIdx] = tentativeG;
        openSet.push(nextIdx, tentativeG + manhattanDistance(nextIdx, goalIdx, m));
      }
    }
  }

  return { path: [], exploredCount, elapsedMs: performance.now() - t0, exhausted: false };
}


export function findPathByLevel({
  level = 3,
  grid,
  m,
  startIdx,
  goalIdx,
  isRecalculation = false,
  obstacleDensity = 0.2,
}) {
  const dist = manhattanDistance(startIdx, goalIdx, m);

  if (level === 3 && isRecalculation && obstacleDensity <= 0.25 && dist <= m) {
    const localRes = findLocalPath(grid, m, startIdx, goalIdx, Math.min(2500, m * m));
    if (!localRes.exhausted) {
      return {
        ...localRes,
        strategyUsed: "Locale bornée (Niveau 3)",
      };
    }
  }

  const globalRes = findPathAStar(grid, m, startIdx, goalIdx);
  return {
    ...globalRes,
    strategyUsed: level === 3 ? "A* complet (Niveau 3)" : `A* (Niveau ${level})`,
  };
}