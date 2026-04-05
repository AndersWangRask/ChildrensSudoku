// Arrow Puzzle — Core Game Logic
// Pure game logic: no React, no UI, no DOM dependencies.

export const DIRS = ["up", "down", "left", "right"];
export const MAX_LIVES = 3;

export const LEVELS = [
  { rows: 3, cols: 4 },
  { rows: 4, cols: 5 },
  { rows: 5, cols: 5 },
  { rows: 5, cols: 6 },
  { rows: 6, cols: 6 },
  { rows: 6, cols: 7 },
  { rows: 7, cols: 7 },
  { rows: 8, cols: 7 },
  { rows: 9, cols: 7 },
];

export const conf = (lvl) => LEVELS[Math.min(lvl - 1, LEVELS.length - 1)];

// Check if path is clear for a given direction
export const pathClearDir = (g, r, c, dir) => {
  const rows = g.length, cols = g[0].length;
  if (dir === "up") { for (let i = r - 1; i >= 0; i--) if (g[i][c]) return false; }
  else if (dir === "down") { for (let i = r + 1; i < rows; i++) if (g[i][c]) return false; }
  else if (dir === "left") { for (let i = c - 1; i >= 0; i--) if (g[r][i]) return false; }
  else if (dir === "right") { for (let i = c + 1; i < cols; i++) if (g[r][i]) return false; }
  return true;
};

export const pathClear = (g, r, c) => {
  const d = g[r][c]?.dir;
  if (!d) return false;
  return pathClearDir(g, r, c, d);
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Greedy solver: verifies a grid is solvable
export const isSolvable = (grid) => {
  const g = grid.map((r) => r.map((c) => (c ? { ...c } : null)));
  let left = g.flat().filter(Boolean).length;
  while (left > 0) {
    let found = false;
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[0].length; c++)
        if (g[r][c] && pathClear(g, r, c)) { g[r][c] = null; left--; found = true; }
    if (!found) return false;
  }
  return true;
};

export const countClearable = (grid) => {
  let n = 0;
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] && pathClear(grid, r, c)) n++;
  return n;
};

// Run greedy solver and return positions of cells it couldn't clear (deadlocked)
export const getStuckCells = (grid) => {
  const g = grid.map((r) => r.map((c) => (c ? { ...c } : null)));
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[0].length; c++)
        if (g[r][c] && pathClear(g, r, c)) { g[r][c] = null; changed = true; }
  }
  const stuck = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++)
      if (g[r][c]) stuck.push([r, c]);
  return stuck;
};

// Would placing dir at (r,c) create an opposing pair with a neighbour?
export const wouldOppose = (grid, r, c, dir, rows, cols) => {
  if (dir === "right" && c + 1 < cols && grid[r][c + 1]?.dir === "left") return true;
  if (dir === "left" && c > 0 && grid[r][c - 1]?.dir === "right") return true;
  if (dir === "down" && r + 1 < rows && grid[r + 1][c]?.dir === "up") return true;
  if (dir === "up" && r > 0 && grid[r - 1][c]?.dir === "down") return true;
  return false;
};

// Does the grid contain any directly-opposing neighbour pairs?
export const hasOpposingPairs = (grid, rows, cols) => {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) continue;
      const d = grid[r][c].dir;
      if (d === "right" && c + 1 < cols && grid[r][c + 1]?.dir === "left") return true;
      if (d === "down" && r + 1 < rows && grid[r + 1][c]?.dir === "up") return true;
    }
  return false;
};

// Quality: no run > 3, balanced directions, no opposing pairs
export const checkQuality = (grid, rows, cols) => {
  if (hasOpposingPairs(grid, rows, cols)) return false;
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c < cols; c++) {
      if (grid[r][c]?.dir === grid[r][c - 1]?.dir) {
        if (++run > 3) return false;
      } else run = 1;
    }
  }
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r < rows; r++) {
      if (grid[r][c]?.dir === grid[r - 1][c]?.dir) {
        if (++run > 3) return false;
      } else run = 1;
    }
  }
  const counts = { up: 0, down: 0, left: 0, right: 0 };
  let total = 0;
  for (const row of grid)
    for (const cell of row)
      if (cell) { counts[cell.dir]++; total++; }
  for (const d of DIRS)
    if (counts[d] < total * 0.14 || counts[d] > total * 0.36) return false;
  return true;
};

// Puzzle generator:
// 1. Fill grid with variety-aware random directions, avoiding opposing pairs
// 2. Iteratively repair deadlocked cells (preferring non-opposing directions)
// 3. Quality-gate the result
export const makePuzzle = (rows, cols) => {
  const total = rows * cols;
  const minClear = Math.max(2, Math.floor(total * 0.04));
  const maxClear = Math.max(8, Math.floor(total * 0.35));

  for (let attempt = 0; attempt < 80; attempt++) {
    // Step 1 — variety-aware random grid, no opposing neighbour pairs
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let best = DIRS[0], bestS = -Infinity;
        for (const dir of DIRS) {
          let s = Math.random();
          if (c > 0 && grid[r][c - 1]?.dir === dir) s -= 0.55;
          if (r > 0 && grid[r - 1][c]?.dir === dir) s -= 0.55;
          if (wouldOppose(grid, r, c, dir, rows, cols)) s -= 1.2;
          if (s > bestS) { bestS = s; best = dir; }
        }
        grid[r][c] = { dir: best, id: `${r}-${c}` };
      }
    }

    // Step 2 — repair: fix stuck cells, prefer non-opposing directions
    for (let repair = 0; repair < 60; repair++) {
      const stuck = getStuckCells(grid);
      if (stuck.length === 0) break;
      const [sr, sc] = stuck[Math.floor(Math.random() * stuck.length)];
      const others = DIRS.filter((d) => d !== grid[sr][sc].dir);
      const safe = others.filter((d) => !wouldOppose(grid, sr, sc, d, rows, cols));
      const pool = safe.length > 0 ? safe : others;
      grid[sr][sc].dir = pool[Math.floor(Math.random() * pool.length)];
    }

    // Step 3 — validate
    if (!isSolvable(grid)) continue;
    const nc = countClearable(grid);
    if (nc < minClear || nc > maxClear) continue;
    if (!checkQuality(grid, rows, cols)) continue;

    return grid;
  }

  // Fallback — constructive method as backup
  for (let fb = 0; fb < 50; fb++) {
    const order = shuffle(
      Array.from({ length: total }, (_, i) => [Math.floor(i / cols), i % cols])
    );
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    let ok = true;
    for (let i = order.length - 1; i >= 0; i--) {
      const [r, c] = order[i];
      const valid = shuffle([...DIRS]).find((d) => pathClearDir(grid, r, c, d));
      if (!valid) { ok = false; break; }
      grid[r][c] = { dir: valid, id: `${r}-${c}` };
    }
    if (ok && isSolvable(grid) && !hasOpposingPairs(grid, grid.length, grid[0].length))
      return grid;
  }

  // Last resort
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      dir: DIRS[Math.floor(Math.random() * 4)], id: `${r}-${c}`,
    }))
  );
};

// Calculate exact slide distance from cell position to grid edge + one extra cell to fully exit
export const calcSlide = (dir, r, c, rows, cols, cellSize, gap) => {
  const step = cellSize + gap;
  let cells;
  switch (dir) {
    case "up":    cells = r + 1; return { transform: `translateY(-${cells * step}px)`, cells };
    case "down":  cells = rows - r; return { transform: `translateY(${cells * step}px)`, cells };
    case "left":  cells = c + 1; return { transform: `translateX(-${cells * step}px)`, cells };
    case "right": cells = cols - c; return { transform: `translateX(${cells * step}px)`, cells };
    default: return { transform: "none", cells: 1 };
  }
};

// Duration scales with distance so speed feels consistent
export const slideDuration = (cells) => Math.min(120 + cells * 70, 600);
