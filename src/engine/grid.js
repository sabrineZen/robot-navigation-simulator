export const CELL = Object.freeze({
  FREE: 0,
  OBSTACLE: 1,
});


export function createGrid(m = 60) {
  if (!Number.isInteger(m) || m < 1) {
    throw new Error("La taille m de la grille doit être un entier positif.");
  }
  return new Uint8Array(m * m); 
}

export function isInsideGrid(x, y, m) {
  return x >= 0 && x < m && y >= 0 && y < m;
}


export function xyToIndex(x, y, m) {
  return y * m + x;
}


export function indexToXY(idx, m) {
  return {
    x: idx % m,
    y: Math.floor(idx / m),
  };
}

export function setObstacle(grid, idx, isBlocked = true) {
  grid[idx] = isBlocked ? CELL.OBSTACLE : CELL.FREE;
}

export function isObstacle(grid, idx) {
  return grid[idx] === CELL.OBSTACLE;
}


export function getWalkableNeighbors(grid, idx, m, protectedIndices = null) {
  const { x, y } = indexToXY(idx, m);
  const neighbors = [];

 
  const directions = [
    [0, -1], 
    [0, 1],  
    [-1, 0], 
    [1, 0],  
  ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (!isInsideGrid(nx, ny, m)) continue;

    const nIdx = xyToIndex(nx, ny, m);
    if (isObstacle(grid, nIdx)) continue;
    if (protectedIndices && protectedIndices.has(nIdx)) continue;

    neighbors.push(nIdx);
  }

  return neighbors;
}


export function randomizeObstacles(grid, density = 0.2, protectedIndices = new Set()) {
  const clampedDensity = Math.max(0, Math.min(0.8, density));

  for (let i = 0; i < grid.length; i++) {
    if (protectedIndices.has(i)) {
      grid[i] = CELL.FREE;
      continue;
    }
    grid[i] = Math.random() < clampedDensity ? CELL.OBSTACLE : CELL.FREE;
  }
}

export function clearGrid(grid) {
  grid.fill(CELL.FREE);
}

export function clearAroundStartAndGoal(grid, m, startIdx, goalIdx) {
  grid[startIdx] = CELL.FREE;
  grid[goalIdx] = CELL.FREE;

  const { x: sx, y: sy } = indexToXY(startIdx, m);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = sx + dx;
      const ny = sy + dy;
      if (isInsideGrid(nx, ny, m)) {
        grid[xyToIndex(nx, ny, m)] = CELL.FREE;
      }
    }
  }

  const { x: gx, y: gy } = indexToXY(goalIdx, m);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (isInsideGrid(nx, ny, m)) {
        grid[xyToIndex(nx, ny, m)] = CELL.FREE;
      }
    }
  }
}