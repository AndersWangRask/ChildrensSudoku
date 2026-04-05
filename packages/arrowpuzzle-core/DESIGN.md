# Arrow Puzzle — Design & Technical Documentation

---

## 1. How the Game Is Played

Arrow Puzzle is a single-player logic game played on a rectangular grid. Every cell contains a coloured tile with an arrow pointing in one of four cardinal directions: up, down, left, or right.

The objective is to clear every tile from the board.

**Core mechanic.** Tapping a tile launches it off the grid in the direction its arrow points — but only if nothing is blocking its path. "Blocking" means another tile sits somewhere between the tapped tile and the edge of the grid along that arrow's line of travel. If the path is completely clear all the way to the edge, the tile slides out and is removed. If the path is blocked, the tap is a mistake.

**Lives.** The player starts each level with three lives (hearts). Each incorrect tap — tapping a tile whose path is blocked — costs one life. Losing all three lives ends the game.

**Levels.** The game progresses through levels of increasing grid size, starting at 3 × 4 (12 tiles) and scaling up to 9 × 7 (63 tiles). Beyond level 9, the grid stays at 9 × 7.

**Scoring.** Each successful tap earns points. Consecutive correct taps build a combo multiplier: the first tap scores 10 points, the second 20, the third 30, and so on. A single mistake resets the combo to zero. This rewards both accuracy and speed.

**Hint.** A hint button highlights one tile that currently has a clear path. It does not reveal the optimal order — only that the highlighted tile can safely be tapped right now.

**Winning a level.** The level is complete when every tile has been cleared. The player receives a star rating (1–3 stars) based on how many lives remain.

---

## 2. How the UI Works

The game is implemented as a single React component (`arrow-puzzle.jsx`) running as a client-side artifact. It uses no external game framework — only React hooks and inline CSS.

### Layout

The grid is rendered using CSS Grid. Cell size is computed dynamically: the available width (capped at 480 px) is divided by the number of columns, minus gaps between cells. This ensures the grid fits comfortably on both desktop and mobile screens. The grid container has `overflow: hidden`, which is what causes tiles to disappear as they slide past the boundary.

### Tile colours

Each tile is coloured with an HSL gradient that depends on its column and row position. Columns sweep from red (hue 0) through yellow and green to blue (hue 205), producing the characteristic rainbow gradient. Rows apply a subtle lightness shift. Each tile has two computed colours — a lighter face and a darker shadow — applied as a `linear-gradient` to give a 3D button effect.

### Slide animation

When the player taps a valid tile, the animation works in two phases to solve a React rendering challenge:

1. **Phase 1 (frame 0).** The tile is marked as "flying" with `started: false`. It renders at its original position with `transform: translateZ(0)` (which triggers GPU compositing) and the CSS `transition` property already applied.

2. **Phase 2 (double requestAnimationFrame).** A `useEffect` detects unstarted flying tiles and, after two animation frames (guaranteeing the browser has painted the "before" state), flips `started` to `true`. The tile now renders with the computed `translateX` or `translateY` value — the exact pixel distance from the tile to the grid edge in its arrow's direction — and the CSS transition smoothly animates between the two states.

The double-rAF pattern is necessary because React batches state updates. Without it, the browser would see only the final transform value and skip the animation entirely. The `pop-in` entry animation also uses `fill-mode: both`, which permanently overrides inline `transform` values, so the animation property is set to `"none"` when a tile starts flying — otherwise the CSS animation would win over the CSS transition in the cascade.

The slide duration scales linearly with distance: `120ms + 70ms × cells`, capped at 600 ms. This keeps the perceived speed consistent regardless of how far a tile travels.

### Effective grid

When a tile is mid-slide, it is still present in the React state (`grid`) but visually departing. An `effectiveGrid` memo excludes flying tiles from the data used by `pathClear` and `findHint`. This means the player can tap a second tile before the first has finished its animation — if the first tile was the only thing blocking the second, the game correctly treats the path as clear.

### Error feedback

When a blocked tile is tapped, it flashes red and shakes using a CSS keyframe animation. The shake animation applies `translateX` offsets and slight rotations over 500 ms.

### Overlays

Level-complete and game-over states render as fixed-position overlays with a blurred backdrop and slide-up entrance animation.

---

## 3. What Makes a Fun and Engaging Puzzle

Through iterative playtesting during development, several principles emerged about what separates a satisfying arrow puzzle from a tedious one.

### The player should have to search

If the answer is visually obvious — all edge tiles point outward, for instance — there is no puzzle. The player is just clicking in a predictable pattern. Good puzzles force the player to scan the grid, trace lines of sight, and identify the few tiles whose paths happen to be clear. The clearable tiles should be scattered unpredictably, not clustered at the edges.

### Removal should create chain reactions

The most satisfying moment in the game is when removing one tile suddenly opens up two or three others. This requires that many tiles' paths are blocked by exactly one other tile. The player who spots the right "key" tile to remove first is rewarded with a cascade of new options.

### No dead ends from the initial state

If two adjacent tiles face each other directly — say, a right-arrow next to a left-arrow in the same row — neither can ever be removed because each permanently blocks the other. This is an irresolvable deadlock. The puzzle must never contain these opposing pairs. More subtly, the puzzle must be solvable by *some* sequence of removals, even if that sequence is not obvious.

### Visual variety

Rows or columns of identical arrows look boring and reduce the puzzle to a trivial pattern. Ideally, adjacent tiles should point in different directions. The grid should use all four directions in roughly equal proportion.

### Difficulty should scale with grid size

Smaller grids (3 × 4) are naturally easier because there are fewer tiles and shorter lines of sight — a tile near the edge almost certainly has a clear path. Larger grids (9 × 7) have longer rows and columns, meaning more potential blockers and fewer immediately-clearable tiles. The grid size progression alone provides a natural difficulty curve without needing to change any rules.

### The number of initially clearable tiles matters

Too many clearable tiles (say 40 %+) and the puzzle is trivially easy — the player can tap almost anything. Too few (under 3 %) and the puzzle feels frustrating, with the player hunting endlessly for a single valid move. A range of roughly 4–35 % provides a good balance: enough options to avoid frustration, few enough to require thought.

### Known remaining issue

At grid sizes of 9 × 7, the generation algorithm occasionally still produces opposing pairs. The opposing-pair check (`wouldOppose`) only considers directly adjacent neighbours that have already been placed during the left-to-right, top-to-bottom fill pass. A tile placed later to the right or below can still create an opposing pair that the earlier tile's placement did not anticipate. Strengthening the repair step to explicitly scan for and break all opposing pairs before the quality gate — rather than relying on random repair — would address this. Alternatively, the checker for opposing pairs on the bottom and right neighbours could also be applied, but this requires a second pass after the grid is fully built.

---

## 4. How the Algorithm Is Implemented

### 4.1 Core data structures

The grid is a 2D array of cell objects (`{ dir, id }`) or `null` for empty cells. `dir` is one of `"up"`, `"down"`, `"left"`, `"right"`. `id` is a string like `"3-5"` (row-col) used as a React key and for tracking flying/shaking state.

### 4.2 Path checking

`pathClearDir(grid, r, c, dir)` checks whether a cell at position (r, c) has a clear path to the grid edge in the given direction. It iterates through every cell between (r, c) and the edge along that axis. If any cell is non-null, the path is blocked. This is an O(n) scan where n is the row or column length.

`pathClear(grid, r, c)` is a convenience wrapper that reads the cell's own direction and calls `pathClearDir`.

### 4.3 Greedy solver

`isSolvable(grid)` works on a deep copy of the grid. It repeatedly scans every cell: if a cell has a clear path, it is removed (set to null). This continues in rounds until either all cells are removed (solvable) or a full round passes with no removals (deadlocked, therefore unsolvable).

The order in which ties are broken within a round does not matter. The greedy solver will always find a solution if one exists, because removing any clearable tile never makes a previously-clearable tile become blocked — it can only open new paths. This is a key invariant of the game mechanics: removal is monotonically helpful.

`getStuckCells(grid)` runs the same greedy solver but returns the positions of cells that could not be cleared, rather than a boolean. These are the deadlocked cells that the repair step targets.

### 4.4 Opposing pair detection

`wouldOppose(grid, r, c, dir, rows, cols)` checks whether placing a given direction at (r, c) would create a direct face-off with an adjacent neighbour. The four patterns are: right facing left (→←), left facing right (←→), down facing up (↓↑), and up facing down (↑↓). If the immediate neighbour in the direction of travel has the opposite direction, they form a permanent deadlock.

`hasOpposingPairs(grid, rows, cols)` scans the entire grid for any such pairs. It only needs to check rightward and downward neighbours (since each pair is detected from one side).

### 4.5 Quality checks

`checkQuality(grid, rows, cols)` enforces three constraints:

1. **No opposing pairs.** Calls `hasOpposingPairs` as a hard reject.
2. **No long runs.** Scans every row and column. If more than 3 consecutive cells share the same direction, the puzzle is rejected. This ensures visual variety.
3. **Direction balance.** Counts how many cells point in each direction. Each direction must represent between 14 % and 36 % of the total. This prevents puzzles dominated by one or two directions.

### 4.6 Puzzle generation: random fill + iterative repair

The generation algorithm went through several iterations during development. Early approaches — purely random (failed solvability checks at scale), constructive from a solution order (forced edge tiles outward, creating trivial outside-in peeling) — all had structural flaws. The final approach is "random fill then repair."

**Step 1: Variety-aware random fill.** The grid is filled left-to-right, top-to-bottom. Each cell is assigned a direction using a scored random selection over all four directions. The score for each candidate direction is:

- Base: a random value between 0 and 1
- Penalty of −0.55 if the left neighbour has the same direction (breaks horizontal runs)
- Penalty of −0.55 if the top neighbour has the same direction (breaks vertical runs)
- Penalty of −1.2 if the direction would create an opposing pair with an already-placed neighbour

The direction with the highest score wins. This produces grids that look naturally scrambled: all four directions appear throughout, runs are rare, and most opposing pairs are avoided during initial placement.

**Step 2: Iterative repair.** The greedy solver identifies deadlocked cells. One stuck cell is chosen at random. Its direction is changed to a randomly selected different direction, with preference given to directions that would not create an opposing pair with its current neighbours. This is repeated for up to 60 iterations. In practice, grids of up to 63 cells typically need 10–30 repairs to become fully solvable.

**Step 3: Validation.** The repaired grid must pass all quality checks: `isSolvable` (safety net after repair), clearable count within bounds (4–35 % of total tiles), and `checkQuality` (no long runs, balanced directions, no opposing pairs). If any check fails, the entire attempt is discarded and a new random grid is generated.

The outer loop runs up to 80 attempts. In testing, successful generation typically occurs within 5–15 attempts.

**Fallback.** If the main loop exhausts its attempts, a constructive fallback generates a grid by defining a random removal order and assigning each cell a direction that has a clear path at the time of placement (working backwards from last-removed to first-removed). This always produces a solvable grid, though with less visual variety. The fallback also checks for opposing pairs before accepting.

### 4.7 Level configuration

Levels are defined as a simple array of `{ rows, cols }` objects:

| Level | Grid size | Total tiles |
|-------|-----------|-------------|
| 1     | 3 × 4     | 12          |
| 2     | 4 × 5     | 20          |
| 3     | 5 × 5     | 25          |
| 4     | 5 × 6     | 30          |
| 5     | 6 × 6     | 36          |
| 6     | 6 × 7     | 42          |
| 7     | 7 × 7     | 49          |
| 8     | 8 × 7     | 56          |
| 9+    | 9 × 7     | 63          |

### 4.8 Slide distance calculation

`calcSlide(dir, r, c, rows, cols, cellSize, gap)` computes the exact pixel distance a tile must travel to exit the grid. For example, a tile at column 2 pointing left must cross columns 1 and 0 plus one extra cell width to fully exit. The distance is `(c + 1) × (cellSize + gap)` pixels. The animation duration is `120 + cells × 70` ms, capped at 600 ms, ensuring tiles that only need to cross one cell move quickly while tiles crossing the full grid take proportionally longer — but all feel like they're moving at the same speed.

---

## Appendix: Development History & Lessons Learned

The puzzle generation algorithm went through six major iterations:

1. **Random generate-and-check.** Generate a fully random grid, check if solvable, retry if not. Failed for grids larger than about 5 × 5 because the probability of a random grid being solvable drops exponentially with size.

2. **Constructive (random order).** Define a random removal order, assign directions backwards so each cell's path is clear when placed. Worked for solvability, but produced boring puzzles with many edge tiles pointing outward. This structural edge bias was unavoidable: edge cells are placed last into a near-full grid where outward is their only option.

3. **Constructive (layer-based order).** Same as above but with deliberate outside-in ordering. Made the edge bias even worse — the game became a trivial peeling exercise.

4. **Constructive with scored direction selection.** Added scoring to penalise matching neighbours and same-direction runs. Improved variety in the interior but could not fix the fundamental edge-bias problem because edge cells still had no choice but to point outward.

5. **Random fill + repair (initial version).** Generated a random grid with neighbour-mismatch penalties, then repaired stuck cells by changing their direction randomly. Produced much more natural-looking puzzles, but occasionally created opposing pairs (→← or ↓↑) that made the puzzle unsolvable.

6. **Random fill + repair with opposing-pair prevention (current).** Added detection and avoidance of opposing pairs at all three stages: initial fill (−1.2 penalty), repair (prefer non-opposing directions), and quality gate (hard reject). This largely eliminates the problem, though at the largest grid size (9 × 7) the repair step can occasionally introduce new opposing pairs that were not present in the initial fill.

The key insight across all iterations: **the generation strategy fundamentally shapes the puzzle's character.** Building from a solution order inherently constrains what the puzzle can look like. Starting from a random-looking grid and making it solvable through targeted repairs preserves the natural, scrambled appearance that makes the puzzle interesting.
