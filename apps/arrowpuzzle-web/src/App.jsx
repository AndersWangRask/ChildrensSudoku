import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DIRS, MAX_LIVES, conf, makePuzzle, pathClear, calcSlide, slideDuration,
} from "@famerlo/arrowpuzzle-core";

const cellColor = (c, cols, r, rows) => {
  const t = cols > 1 ? c / (cols - 1) : 0;
  const h = t * 205;
  const s = 68 + Math.sin(t * Math.PI) * 14;
  const rT = rows > 1 ? r / (rows - 1) : 0;
  const l = 58 - t * 6 + rT * 4;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const cellShadow = (c, cols, r, rows) => {
  const t = cols > 1 ? c / (cols - 1) : 0;
  const h = t * 205;
  const s = 68 + Math.sin(t * Math.PI) * 14;
  const rT = rows > 1 ? r / (rows - 1) : 0;
  const l = 42 - t * 6 + rT * 4;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const Arrow = ({ dir }) => {
  const rot = { up: -90, down: 90, left: 180, right: 0 }[dir];
  return (
    <svg viewBox="0 0 24 24" style={{ width: "55%", height: "55%", transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}>
      <path d="M4 12h16M14 5l7 7-7 7" stroke="rgba(0,0,0,0.65)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
};

const Heart = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" style={{ margin: "0 2px", filter: filled ? "drop-shadow(0 0 4px rgba(239,68,68,0.5))" : "none", transition: "all 0.3s" }}>
    <path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? "#ef4444" : "rgba(0,0,0,0.15)"}
      style={{ transition: "fill 0.3s" }}
    />
  </svg>
);

export default function ArrowPuzzle() {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [phase, setPhase] = useState("playing");
  const [score, setScore] = useState(0);
  const [flying, setFlying] = useState({});
  const [shaking, setShaking] = useState({});
  const [hinted, setHinted] = useState(null);
  const [combo, setCombo] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [totalArrows, setTotalArrows] = useState(0);

  const startLevel = useCallback((lvl) => {
    const { rows, cols } = conf(lvl);
    const g = makePuzzle(rows, cols);
    setGrid(g);
    setLives(MAX_LIVES);
    setPhase("playing");
    setFlying({});
    setShaking({});
    setHinted(null);
    setCombo(0);
    setCleared(0);
    setTotalArrows(rows * cols);
  }, []);

  useEffect(() => { startLevel(level); }, [level, startLevel]);

  const remaining = useMemo(() => grid.flat().filter(Boolean).length - Object.keys(flying).length, [grid, flying]);

  const { rows, cols } = conf(level);
  const gap = 5;
  const maxW = Math.min(480, typeof window !== "undefined" ? window.innerWidth - 32 : 480);
  const cellSize = Math.floor((maxW - gap * (cols - 1)) / cols);

  // Effective grid: treat flying tiles as already gone
  const effectiveGrid = useMemo(() =>
    grid.map(row => row.map(cell => (cell && flying[cell.id]) ? null : cell)),
    [grid, flying]
  );

  const findHint = useCallback(() => {
    for (let r = 0; r < effectiveGrid.length; r++)
      for (let c = 0; c < effectiveGrid[0].length; c++)
        if (effectiveGrid[r][c] && pathClear(effectiveGrid, r, c))
          return effectiveGrid[r][c].id;
    return null;
  }, [effectiveGrid]);

  const handleTap = useCallback((r, c) => {
    if (phase !== "playing") return;
    const cell = grid[r][c];
    if (!cell || flying[cell.id]) return;

    const { rows: R, cols: C } = conf(level);

    if (pathClear(effectiveGrid, r, c)) {
      const id = cell.id;
      const slide = calcSlide(cell.dir, r, c, R, C, cellSize, gap);
      const dur = slideDuration(slide.cells);
      setFlying((p) => ({ ...p, [id]: { ...slide, dir: cell.dir, dur, started: false } }));
      setCombo((p) => p + 1);
      setScore((p) => p + 10 * (combo + 1));
      setCleared((p) => p + 1);
      setHinted(null);

      setTimeout(() => {
        setGrid((prev) => {
          const ng = prev.map((row) => [...row]);
          ng[r][c] = null;
          const left = ng.flat().filter(Boolean).length;
          if (left === 0) setTimeout(() => setPhase("levelComplete"), 100);
          return ng;
        });
        setFlying((p) => { const n = { ...p }; delete n[id]; return n; });
      }, dur + 50);
    } else {
      setShaking((p) => ({ ...p, [cell.id]: true }));
      setCombo(0);
      setHinted(null);
      const nl = lives - 1;
      setLives(nl);
      if (nl <= 0) setTimeout(() => setPhase("gameOver"), 400);
      setTimeout(() => setShaking((p) => { const n = { ...p }; delete n[cell.id]; return n; }), 600);
    }
  }, [phase, grid, flying, effectiveGrid, lives, combo, level, cellSize, gap]);

  // Two-phase animation: after rendering at initial position, trigger the slide on the next frame
  useEffect(() => {
    const unstarted = Object.entries(flying).filter(([_, v]) => !v.started);
    if (unstarted.length === 0) return;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setFlying((prev) => {
          const next = { ...prev };
          for (const [id] of unstarted) {
            if (next[id]) next[id] = { ...next[id], started: true };
          }
          return next;
        });
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [flying]);

  const useHint = () => {
    const id = findHint();
    if (id) setHinted(id);
  };

  const gridW = cellSize * cols + gap * (cols - 1);
  const gridH = cellSize * rows + gap * (rows - 1);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "16px",
      userSelect: "none",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px) rotate(-2deg); }
          30% { transform: translateX(5px) rotate(1.5deg); }
          45% { transform: translateX(-4px) rotate(-1deg); }
          60% { transform: translateX(3px) rotate(0.5deg); }
          75% { transform: translateX(-2px); }
        }
        @keyframes pulse-hint {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .cell-btn { cursor: pointer; border: none; outline: none; padding: 0; }
        .cell-btn:active { transform: scale(0.92); }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: gridW, marginBottom: 16, color: "white",
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 13, opacity: 0.6, letterSpacing: 2, textTransform: "uppercase" }}>Level</span>
          <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{level}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", marginBottom: 4 }}>
            {Array.from({ length: MAX_LIVES }).map((_, i) => <Heart key={i} filled={i < lives} />)}
          </div>
          <span style={{ fontSize: 12, opacity: 0.5 }}>{remaining} left</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: 13, opacity: 0.6, letterSpacing: 2, textTransform: "uppercase" }}>Score</span>
          <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{score}</span>
        </div>
      </div>

      {/* Combo indicator */}
      {combo > 1 && (
        <div style={{
          color: "#fbbf24", fontSize: 14, fontWeight: 700, marginBottom: 8,
          animation: "slide-up 0.25s ease-out",
        }}>
          {combo}x Combo! +{10 * combo} pts
        </div>
      )}

      {/* Grid */}
      <div style={{
        position: "relative",
        width: gridW, height: gridH,
        overflow: "hidden",
        borderRadius: 12,
        background: "rgba(0,0,0,0.3)",
        padding: 0,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: gap,
        }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) {
                return (
                  <div key={`${r}-${c}`} style={{
                    width: cellSize, height: cellSize,
                    borderRadius: 8, background: "rgba(0,0,0,0.15)",
                  }} />
                );
              }
              const isFly = flying[cell.id];
              const isShake = shaking[cell.id];
              const isHint = hinted === cell.id;
              const bg = cellColor(c, cols, r, rows);
              const shadow = cellShadow(c, cols, r, rows);

              return (
                <button
                  key={cell.id}
                  className="cell-btn"
                  onClick={() => handleTap(r, c)}
                  style={{
                    width: cellSize, height: cellSize,
                    borderRadius: 8,
                    position: "relative",
                    zIndex: isFly ? 10 : 1,
                    background: isShake
                      ? `linear-gradient(145deg, #ef4444, #dc2626)`
                      : `linear-gradient(145deg, ${bg}, ${shadow})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isFly
                      ? `0 6px 20px rgba(0,0,0,0.5)`
                      : isHint
                        ? `0 0 0 3px rgba(255,255,255,0.9), 0 3px 8px rgba(0,0,0,0.3)`
                        : `0 3px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    transform: isFly ? (isFly.started ? isFly.transform : "translateZ(0)") : "none",
                    transition: isFly
                      ? `transform ${isFly.dur}ms cubic-bezier(0.15, 0, 0.7, 1)`
                      : "background 0.3s",
                    animation: isShake
                      ? "shake 0.5s ease-in-out"
                      : isFly
                        ? "none"
                        : isHint
                          ? "pulse-hint 1s infinite"
                          : `pop-in 0.3s ease-out ${(r * cols + c) * 15}ms both`,
                  }}
                >
                  <Arrow dir={cell.dir} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={useHint}
          disabled={phase !== "playing"}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: 10, padding: "10px 24px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            opacity: phase !== "playing" ? 0.4 : 1,
            transition: "all 0.2s",
          }}
        >
          💡 Hint
        </button>
        <button
          onClick={() => startLevel(level)}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: 10, padding: "10px 24px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🔄 Restart
        </button>
      </div>

      {/* Level Complete Overlay */}
      {phase === "levelComplete" && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 100, animation: "slide-up 0.4s ease-out",
        }}>
          <div style={{
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            borderRadius: 24, padding: "40px 48px",
            textAlign: "center", color: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            maxWidth: 340,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8, animation: "float 2s infinite" }}>🎉</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>Level {level} Clear!</h2>
            <p style={{ opacity: 0.6, margin: "0 0 20px", fontSize: 14 }}>
              Score: {score} · Lives remaining: {lives}
            </p>
            <div style={{
              display: "flex", gap: 8, marginBottom: 12,
              justifyContent: "center",
            }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{
                  fontSize: 28,
                  filter: i < lives ? "none" : "grayscale(1) opacity(0.3)",
                  animation: i < lives ? `pop-in 0.3s ease-out ${i * 150}ms both` : "none",
                }}>⭐</span>
              ))}
            </div>
            <button
              onClick={() => setLevel((l) => l + 1)}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none", borderRadius: 14, padding: "14px 40px",
                color: "white", fontSize: 18, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 15px rgba(34,197,94,0.4)",
                transition: "transform 0.15s",
                width: "100%",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Next Level →
            </button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === "gameOver" && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 100, animation: "slide-up 0.4s ease-out",
        }}>
          <div style={{
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            borderRadius: 24, padding: "40px 48px",
            textAlign: "center", color: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            maxWidth: 340,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💔</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>Game Over</h2>
            <p style={{ opacity: 0.6, margin: "0 0 8px", fontSize: 14 }}>
              Reached Level {level} · Final Score: {score}
            </p>
            <p style={{ opacity: 0.4, margin: "0 0 24px", fontSize: 13 }}>
              {cleared}/{totalArrows} arrows cleared
            </p>
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button
                onClick={() => startLevel(level)}
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  border: "none", borderRadius: 14, padding: "14px 40px",
                  color: "white", fontSize: 16, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
                  width: "100%",
                }}
              >
                🔄 Retry Level {level}
              </button>
              <button
                onClick={() => { setScore(0); setLevel(1); }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14, padding: "12px 40px",
                  color: "white", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", width: "100%",
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
