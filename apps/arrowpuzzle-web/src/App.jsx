import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  GRID_SIZES, MAX_ACTIVE_ERRORS, ERROR_DURATION_MS,
  makePuzzle, pathClear, calcSlide, slideDuration,
} from "@famerlo/arrowpuzzle-core";

const SAD_EMOJIS = ['😢', '😭', '😤', '😠', '😡', '🤬', '😰', '😨', '😱', '😖', '😣', '😞', '😩', '🥺', '😿'];

function randomSadEmoji() {
  return SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)];
}

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

const HowToPlay = ({ onClose }) => (
  <div style={{
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <div style={{
      background: "linear-gradient(145deg, #1e293b, #0f172a)",
      width: "100%", height: "100%",
      maxWidth: 480, maxHeight: "90vh",
      borderRadius: window.innerWidth >= 640 ? 20 : 0,
      margin: window.innerWidth >= 640 ? 16 : 0,
      display: "flex", flexDirection: "column",
      color: "white",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>How to Play / About Us</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.5)",
          fontSize: 28, cursor: "pointer", padding: "0 4px", lineHeight: 1,
        }}>&times;</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>The Goal</h3>
        <p style={{ opacity: 0.8, marginBottom: 16, lineHeight: 1.6 }}>
          Clear every arrow tile from the board by tapping them. An arrow can only be removed if its path to the edge of the board is completely clear.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>How to Play</h3>
        <ul style={{ opacity: 0.8, lineHeight: 1.8, paddingLeft: 20, listStyleType: "disc", marginBottom: 16 }}>
          <li>Tap an arrow tile to slide it off the board.</li>
          <li>The arrow slides in the direction it points.</li>
          <li>If another tile is blocking the path, the tap is a mistake.</li>
          <li>Removing a tile may open up new paths for other tiles.</li>
          <li>Use the <b>Hint</b> button to highlight a tile that can be removed.</li>
        </ul>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>Mistakes</h3>
        <ul style={{ opacity: 0.8, lineHeight: 1.8, paddingLeft: 20, listStyleType: "disc", marginBottom: 16 }}>
          <li>Each mistake shows an unhappy emoji that lasts 30 seconds.</li>
          <li>If you have 5 unhappy emojis at the same time, it's game over!</li>
          <li>Take your time — there is no timer.</li>
        </ul>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", marginBottom: 8 }}>Puzzle Size</h3>
        <ul style={{ opacity: 0.8, lineHeight: 1.8, paddingLeft: 20, listStyleType: "disc", marginBottom: 16 }}>
          {GRID_SIZES.map(s => (
            <li key={s.label}><b>{s.label}</b> — {s.rows} x {s.cols} grid ({s.rows * s.cols} tiles)</li>
          ))}
        </ul>

        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#60a5fa", marginTop: 24, marginBottom: 8 }}>About Famerlo</h3>
        <p style={{ opacity: 0.8, lineHeight: 1.6, marginBottom: 8 }}>
          Arrow Puzzle is brought to you by Famerlo.
        </p>
        <p style={{ opacity: 0.8, lineHeight: 1.6, marginBottom: 8 }}>
          Famerlo is an AI-powered family assistant that helps busy parents manage their children's activities, schedules, and daily logistics — all through natural conversation.
        </p>
        <p style={{ opacity: 0.8, lineHeight: 1.6, marginBottom: 8 }}>
          It integrates with Google Calendar, Apple Calendar, and Microsoft Outlook, and can even translate school messages and activity notes for families new to a country.
        </p>
        <p style={{ opacity: 0.8, lineHeight: 1.6, marginBottom: 8 }}>
          Famerlo is GDPR-compliant, with family data hosted in Scandinavia and double-encrypted.
        </p>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          Visit <a href="https://famerlo.com" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>famerlo.com</a> to learn more.
        </p>
      </div>

      <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onClose} style={{
          width: "100%",
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          border: "none", borderRadius: 12, padding: "14px",
          color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
        }}>Got it!</button>
      </div>
    </div>
  </div>
);

export default function ArrowPuzzle() {
  const [gridSizeIndex, setGridSizeIndex] = useState(0);
  const [grid, setGrid] = useState([]);
  const [phase, setPhase] = useState("playing");
  const [flying, setFlying] = useState({});
  const [shaking, setShaking] = useState({});
  const [hinted, setHinted] = useState(null);
  const [activeErrors, setActiveErrors] = useState([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const errorTimersRef = useRef([]);

  const { rows, cols } = GRID_SIZES[gridSizeIndex];

  const startPuzzle = useCallback((sizeIdx) => {
    const { rows: r, cols: c } = GRID_SIZES[sizeIdx];
    const g = makePuzzle(r, c);
    setGrid(g);
    setPhase("playing");
    setFlying({});
    setShaking({});
    setHinted(null);
    setActiveErrors([]);
    errorTimersRef.current.forEach(t => clearTimeout(t));
    errorTimersRef.current = [];
  }, []);

  useEffect(() => { startPuzzle(gridSizeIndex); }, [gridSizeIndex, startPuzzle]);

  const remaining = useMemo(() =>
    grid.flat().filter(Boolean).length - Object.keys(flying).length,
    [grid, flying]
  );

  const gap = 5;
  const maxW = Math.min(480, typeof window !== "undefined" ? window.innerWidth - 32 : 480);
  const cellSize = Math.floor((maxW - gap * (cols - 1)) / cols);

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

  const addError = useCallback(() => {
    const id = Date.now() + Math.random();
    const emoji = randomSadEmoji();

    setActiveErrors(prev => {
      const updated = [...prev, { id, emoji }];
      if (updated.length >= MAX_ACTIVE_ERRORS) {
        setTimeout(() => setPhase("gameOver"), 400);
      }
      return updated;
    });

    const timer = setTimeout(() => {
      setActiveErrors(prev => prev.filter(e => e.id !== id));
    }, ERROR_DURATION_MS);
    errorTimersRef.current.push(timer);
  }, []);

  const handleTap = useCallback((r, c) => {
    if (phase !== "playing") return;
    const cell = grid[r][c];
    if (!cell || flying[cell.id]) return;

    if (pathClear(effectiveGrid, r, c)) {
      const id = cell.id;
      const slide = calcSlide(cell.dir, r, c, rows, cols, cellSize, gap);
      const dur = slideDuration(slide.cells);
      setFlying((p) => ({ ...p, [id]: { ...slide, dir: cell.dir, dur, started: false } }));
      setHinted(null);

      setTimeout(() => {
        setGrid((prev) => {
          const ng = prev.map((row) => [...row]);
          ng[r][c] = null;
          const left = ng.flat().filter(Boolean).length;
          if (left === 0) setTimeout(() => setPhase("complete"), 100);
          return ng;
        });
        setFlying((p) => { const n = { ...p }; delete n[id]; return n; });
      }, dur + 50);
    } else {
      setShaking((p) => ({ ...p, [cell.id]: true }));
      setHinted(null);
      addError();
      setTimeout(() => setShaking((p) => { const n = { ...p }; delete n[cell.id]; return n; }), 600);
    }
  }, [phase, grid, flying, effectiveGrid, rows, cols, cellSize, gap, addError]);

  // Two-phase animation
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
      background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "16px",
      userSelect: "none",
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
        @keyframes bounce-error {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .cell-btn { cursor: pointer; border: none; outline: none; padding: 0; }
        .cell-btn:active { transform: scale(0.92); }
      `}</style>

      {/* Title */}
      <h1 style={{
        color: "white", fontSize: 20, fontWeight: 800,
        marginBottom: 12, opacity: 0.9, letterSpacing: 1,
      }}>Arrow Puzzle</h1>

      {/* Grid size selector + New Puzzle */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 12, alignItems: "center",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        <select
          value={gridSizeIndex}
          onChange={(e) => setGridSizeIndex(Number(e.target.value))}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: 8, padding: "8px 12px",
            fontSize: 14, cursor: "pointer",
          }}
        >
          {GRID_SIZES.map((s, i) => (
            <option key={s.label} value={i} style={{ background: "#1e293b" }}>
              {s.label} ({s.rows}x{s.cols})
            </option>
          ))}
        </select>
        <button
          onClick={() => startPuzzle(gridSizeIndex)}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "white", borderRadius: 8, padding: "8px 16px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          New Puzzle
        </button>
      </div>

      {/* Error emojis / status area */}
      <div style={{
        minHeight: 40, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 6, marginBottom: 8,
      }}>
        {phase === "complete" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{
              color: "#22c55e", fontWeight: 800, fontSize: 18,
              whiteSpace: "nowrap",
            }}>
              Puzzle Complete! 🎉
            </span>
            <button
              onClick={() => startPuzzle(gridSizeIndex)}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                border: "none", borderRadius: 10, padding: "10px 28px",
                color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Play Again
            </button>
          </div>
        ) : phase === "gameOver" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{
              color: "#ef4444", fontWeight: 800, fontSize: 16,
              whiteSpace: "nowrap",
            }}>
              Game Over! Too many mistakes! 😢
            </span>
            <button
              onClick={() => startPuzzle(gridSizeIndex)}
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: 10, padding: "10px 28px",
                color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          activeErrors.map(error => (
            <span
              key={error.id}
              style={{
                fontSize: 24,
                animation: "bounce-error 1s infinite",
              }}
            >
              {error.emoji}
            </span>
          ))
        )}
      </div>

      {/* Remaining tiles indicator */}
      {phase === "playing" && (
        <div style={{ color: "white", opacity: 0.5, fontSize: 12, marginBottom: 8 }}>
          {remaining} tiles left
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
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
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
          Hint
        </button>
      </div>

      {/* How to play link */}
      <button
        onClick={() => setShowHowToPlay(true)}
        style={{
          background: "none", border: "none",
          color: "rgba(255,255,255,0.5)", fontSize: 13,
          cursor: "pointer", marginTop: 12,
          textDecoration: "underline",
        }}
      >
        How to play / About us
      </button>

      {/* Famerlo footer */}
      <footer style={{
        width: "100%", marginTop: "auto", paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}>
        <a
          href="https://famerlo.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", textAlign: "center",
            fontSize: 13, color: "rgba(255,255,255,0.5)",
            textDecoration: "none", padding: "12px 0",
          }}
        >
          <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "1.2em", height: "1.2em", verticalAlign: "middle" }}>
              <circle cx="7" cy="12" r="2" fill="#E8893C" />
              <circle cx="12" cy="12" r="2" fill="#E8893C" opacity="0.7" />
              <circle cx="17" cy="12" r="2" fill="#E8893C" opacity="0.4" />
            </svg>
            Famerlo - Family life, organized!
          </span><br />
          AI-powered family assistant for busy parents<br />
          <span style={{ textDecoration: "underline" }}>Click here to learn more</span>
        </a>
      </footer>

      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
