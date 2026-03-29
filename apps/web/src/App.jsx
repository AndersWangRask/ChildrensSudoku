import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import {
  FRUITS,
  DIFFICULTIES,
  gridLogic,
  selectRandomFruits,
  generateRandomSolution,
  removeEmojisBalanced,
  checkCompletedSections,
  isBoardComplete,
  getHint
} from '@fruit-sudoku/core';
import { playCorrectSound, playWrongSound, playSectionCompleteSound, playPuzzleCompleteSound } from './sounds';

const SAD_EMOJIS = ['😢', '😭', '😤', '😠', '😡', '🤬', '😰', '😨', '😱', '😖', '😣', '😞', '😩', '🥺', '😿'];
const MAX_ACTIVE_ERRORS = 5;
const ERROR_DURATION_MS = 30000;

function randomSadEmoji() {
  return SAD_EMOJIS[Math.floor(Math.random() * SAD_EMOJIS.length)];
}

function isFruitComplete(fruit, board, solution) {
  if (!solution.length || !board.length) return false;
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      if (solution[r][c] === fruit && board[r][c] !== fruit) return false;
    }
  }
  return true;
}

// UI-specific grid styling
const gridStyling = {
  4: {
    getCellClassName: (rowIndex, colIndex, board, feedbackCell, completedSections) => {
      const isBoxBorder = rowIndex === 1;
      const isBoxRightBorder = colIndex === 1;
      return getCellClassNameHelper(4, rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 2);
    }
  },
  6: {
    getCellClassName: (rowIndex, colIndex, board, feedbackCell, completedSections) => {
      const isBoxBorder = rowIndex === 1 || rowIndex === 3;
      const isBoxRightBorder = colIndex === 2;
      return getCellClassNameHelper(6, rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 2);
    }
  },
  9: {
    getCellClassName: (rowIndex, colIndex, board, feedbackCell, completedSections) => {
      const isBoxBorder = rowIndex === 2 || rowIndex === 5;
      const isBoxRightBorder = colIndex === 2 || colIndex === 5;
      return getCellClassNameHelper(9, rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 3);
    }
  }
};

const getCellClassNameHelper = (
  gridSize,
  rowIndex,
  colIndex,
  board,
  feedbackCell,
  completedSections,
  isBoxBorder,
  isBoxRightBorder,
  boxSize
) => {
  const isFeedbackCell = feedbackCell && feedbackCell.row === rowIndex && feedbackCell.col === colIndex;
  const isErrorCell = isFeedbackCell && !feedbackCell.correct;
  const isEmptyCell = board[rowIndex][colIndex] === null;

  return `aspect-square flex items-center justify-center
          border border-green-300 cursor-pointer
          ${isBoxBorder ? 'border-b-2 border-b-green-600' : ''}
          ${isBoxRightBorder ? 'border-r-2 border-r-green-600' : ''}
          ${!isErrorCell && isEmptyCell ? 'hover:bg-yellow-200' : ''}
          ${isErrorCell ? 'bg-red-500 transition duration-500 ease-in-out' : ''}
          ${
            completedSections.some(section =>
              section.type === 'row'
                ? section.index === rowIndex
                : section.type === 'col'
                ? section.index === colIndex
                : section.type === 'box' &&
                  rowIndex >= section.row &&
                  rowIndex < section.row + (section.height || boxSize) &&
                  colIndex >= section.col &&
                  colIndex < section.col + (section.width || boxSize)
            )
              ? 'bg-yellow-100'
              : ''
          }`;
};

const HowToPlay = ({ onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-yellow-50 w-full h-full sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl sm:m-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-yellow-200">
        <h2 className="text-xl font-bold text-green-600">How to Play / About Us 🍎</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1" aria-label="Close">
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-lg font-bold text-green-700 mt-1 mb-1">The Rules</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Fill every empty cell with a fruit.</li>
          <li>Each <b>row</b> must have every fruit exactly once.</li>
          <li>Each <b>column</b> must have every fruit exactly once.</li>
          <li>Each <b>box</b> (thick borders) must have every fruit exactly once.</li>
        </ul>

        <h3 className="text-lg font-bold text-green-700 mt-4 mb-1">How to Play</h3>
        <ol className="list-decimal pl-5 space-y-1 text-gray-700">
          <li>Tap a <b>fruit button</b> below the board to pick it up.</li>
          <li>Tap an <b>empty cell</b> on the board to place it.</li>
          <li>If correct, the fruit stays. If wrong, you get a sad face!</li>
          <li>When all cells for a fruit are filled, its button gets a checkmark.</li>
        </ol>

        <h3 className="text-lg font-bold text-green-700 mt-4 mb-1">Watch Out!</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Each mistake adds a sad emoji that lasts 30 seconds.</li>
          <li>If you have 5 sad emojis at the same time, it's game over!</li>
          <li>Press <b>New Puzzle</b> to start fresh any time.</li>
        </ul>

        <h3 className="text-lg font-bold text-green-700 mt-4 mb-1">Difficulty</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><b>Easy</b> — 4x4 grid (great for beginners!)</li>
          <li><b>Medium</b> — 6x6 grid</li>
          <li><b>Hard</b> — 9x9 grid (classic Sudoku size)</li>
        </ul>

        <h3 className="text-lg font-bold text-green-700 mt-6 mb-1">About Famerlo</h3>
        <p className="text-gray-700 mt-2">Free Fruit Sudoku for Kids is brought to you by Famerlo.</p>
        <p className="text-gray-700 mt-2">Famerlo is an AI-powered family assistant that helps busy parents manage their children's activities, schedules, and daily logistics — all through natural conversation.</p>
        <p className="text-gray-700 mt-2">It integrates with Google Calendar, Apple Calendar, and Microsoft Outlook, and can even translate school messages and activity notes for families new to a country.</p>
        <p className="text-gray-700 mt-2">Famerlo is GDPR-compliant, with family data hosted in Scandinavia and double-encrypted.</p>
        <p className="text-gray-700 mt-2">
          Visit <a href="https://famerlo.com" target="_blank" rel="noopener noreferrer" className="text-green-600 underline hover:text-green-800">famerlo.com</a> to learn more
        </p>
      </div>

      <div className="p-4 border-t border-yellow-200">
        <button
          onClick={onClose}
          className="w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-600 transition"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
);

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 500);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

const EmojiSudoku = () => {
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentFruits, setCurrentFruits] = useState([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [gridSize, setGridSize] = useState(DIFFICULTIES.easy.gridSize);
  const [feedbackCell, setFeedbackCell] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);
  const [activeErrors, setActiveErrors] = useState([]);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [hintCell, setHintCell] = useState(null);
  const [flashingSections, setFlashingSections] = useState([]);
  const errorTimersRef = useRef([]);
  const windowWidth = useWindowWidth();

  // Board width matches the grid container: min(viewport - padding, 500px)
  const boardWidth = Math.min(windowWidth - 48, 500);
  const cellSize = boardWidth / gridSize;
  const buttonSize = cellSize * 0.85;
  const cellFontSize = Math.max(14, Math.min(cellSize * 0.6, 60));
  const buttonFontSize = Math.max(12, Math.min(cellSize * 0.5, 50));

  useEffect(() => {
    return () => errorTimersRef.current.forEach(t => clearTimeout(t));
  }, []);

  const clearErrors = () => {
    errorTimersRef.current.forEach(t => clearTimeout(t));
    errorTimersRef.current = [];
    setActiveErrors([]);
  };

  const generateNewPuzzle = (newDifficulty = difficulty) => {
    clearErrors();

    const newGridSize = DIFFICULTIES[newDifficulty].gridSize;
    setGridSize(newGridSize);
    const newFruits = selectRandomFruits(newGridSize);
    setCurrentFruits(newFruits);
    const newSolution = generateRandomSolution(newFruits, newGridSize);
    const newPuzzle = removeEmojisBalanced(newSolution, DIFFICULTIES[newDifficulty].numRemove, newGridSize);
    setBoard(newPuzzle);
    setSolution(newSolution);
    setIsComplete(false);
    setIsGameOver(false);
    setSelectedEmoji(null);
    setFeedbackCell(null);
    setCompletedSections([]);
    setHintCell(null);
  };

  useEffect(() => {
    generateNewPuzzle();
  }, []);

  const addError = useCallback(() => {
    const id = Date.now() + Math.random();
    const emoji = randomSadEmoji();
    const newError = { id, emoji };

    setActiveErrors(prev => {
      const updated = [...prev, newError];
      if (updated.length >= MAX_ACTIVE_ERRORS) {
        setIsGameOver(true);
      }
      return updated;
    });

    const timer = setTimeout(() => {
      setActiveErrors(prev => prev.filter(e => e.id !== id));
    }, ERROR_DURATION_MS);
    errorTimersRef.current.push(timer);
  }, []);

  const handleHint = () => {
    if (isComplete || isGameOver) return;
    const hint = getHint(board, solution);
    if (!hint) return;
    setSelectedEmoji(null);
    setHintCell(hint);
    setTimeout(() => setHintCell(null), 2000);
  };

  const handleCellClick = (row, col) => {
    if (isGameOver || isComplete) return;
    setHintCell(null);
    if (selectedEmoji && board[row][col] === null) {
      if (selectedEmoji === solution[row][col]) {
        const newBoard = [...board];
        newBoard[row][col] = selectedEmoji;
        setBoard(newBoard);
        setSelectedEmoji(null);
        setFeedbackCell({ row, col, correct: true });
        setTimeout(() => setFeedbackCell(null), 500);

        const newCompletedSections = checkCompletedSections(newBoard, row, col, completedSections, gridSize);
        setCompletedSections(newCompletedSections);

        if (isBoardComplete(newBoard)) {
          setIsComplete(true);
          clearErrors();
          playPuzzleCompleteSound();
        } else if (newCompletedSections.length > completedSections.length) {
          const delta = newCompletedSections.slice(completedSections.length);
          setFlashingSections(delta);
          setTimeout(() => setFlashingSections([]), 800);
          playSectionCompleteSound();
        } else {
          playCorrectSound();
        }
      } else {
        addError();
        setFeedbackCell({ row, col, correct: false });
        setTimeout(() => setFeedbackCell(null), 500);
        playWrongSound();
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-yellow-100">
      <div className="flex flex-col items-center p-4 w-full max-w-lg flex-1">
      <h2 className="text-2xl mb-4 font-bold text-green-600">Free Fruit Sudoku for Kids 🍎</h2>
      <div role="grid" aria-label="Sudoku puzzle board"
           className={`grid grid-cols-${gridSize} gap-0 mb-4 p-2 bg-white rounded-lg shadow-md w-full`}
           style={{
             maxWidth: '500px',
             fontSize: `${cellFontSize}px`,
           }}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isHintCell = hintCell && hintCell.row === rowIndex && hintCell.col === colIndex;
            const isFlashing = flashingSections.some(section =>
              section.type === 'row' ? section.index === rowIndex
              : section.type === 'col' ? section.index === colIndex
              : section.type === 'box' && rowIndex >= section.row && rowIndex < section.row + section.height && colIndex >= section.col && colIndex < section.col + section.width
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                role="gridcell"
                aria-label={cell ? `Row ${rowIndex + 1}, Column ${colIndex + 1}: ${cell}` : `Row ${rowIndex + 1}, Column ${colIndex + 1}: empty`}
                tabIndex={0}
                className={`${gridStyling[gridSize].getCellClassName(rowIndex, colIndex, board, feedbackCell, completedSections)}${isHintCell ? ' ring-2 ring-yellow-400 animate-pulse' : ''}${isFlashing ? ' animate-section-flash' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCellClick(rowIndex, colIndex); }}
              >
                {cell || (isHintCell ? <span className="opacity-30">{hintCell.fruit}</span> : null)}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-center gap-1 mb-4 w-full" style={{ maxWidth: '500px' }}>
        {currentFruits.map(fruit => {
          const completed = isFruitComplete(fruit, board, solution);
          return (
            <button
              key={fruit}
              onClick={() => !completed && setSelectedEmoji(selectedEmoji === fruit ? null : fruit)}
              disabled={completed}
              aria-label={completed ? `${fruit} completed` : `Select ${fruit}`}
              aria-pressed={selectedEmoji === fruit}
              className={`relative flex items-center justify-center rounded-lg border-2 transition-colors ${
                completed
                  ? 'bg-green-100 opacity-70 cursor-default border-green-300'
                  : selectedEmoji === fruit
                  ? 'bg-yellow-300 border-yellow-400'
                  : 'bg-white border-gray-200 hover:bg-yellow-100'
              }`}
              style={{
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                fontSize: `${buttonFontSize}px`,
                padding: 0,
              }}
            >
              {fruit}
              {completed && (
                <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="status" aria-live="polite" aria-label="Game status" className="mb-2 min-h-10 flex items-center justify-center space-x-1">
        {isComplete ? (
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-green-600 animate-bounce whitespace-nowrap" style={{ fontSize: 'min(5vw, 1.25rem)' }}>
              Congratulations! You solved the puzzle! 🎉
            </span>
            <button
              onClick={() => generateNewPuzzle(difficulty)}
              className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition"
            >
              Play Again
            </button>
          </div>
        ) : isGameOver ? (
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-red-600 animate-pulse whitespace-nowrap" style={{ fontSize: 'min(5vw, 1.25rem)' }}>
              Game Over! Too many mistakes! 😢
            </span>
            <button
              onClick={() => generateNewPuzzle(difficulty)}
              className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          activeErrors.map(error => (
            <span
              key={error.id}
              className="text-2xl animate-bounce"
              style={{ animationDuration: '1s' }}
            >
              {error.emoji}
            </span>
          ))
        )}
      </div>
      <div className="flex items-center space-x-4 mb-2">
        <Select onValueChange={(value) => {
          setDifficulty(value);
          generateNewPuzzle(value);
        }} defaultValue={difficulty}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="easy">Easy (4x4)</SelectItem>
            <SelectItem value="medium">Medium (6x6)</SelectItem>
            <SelectItem value="hard">Hard (9x9)</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => generateNewPuzzle(difficulty)} className="bg-green-500 text-white">New Puzzle</Button>
        {difficulty === 'easy' && (
          <button
            onClick={handleHint}
            className="bg-yellow-400 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition"
          >
            Hint 💡
          </button>
        )}
      </div>
      <button
        onClick={() => setShowHowToPlay(true)}
        className="mt-2 text-green-600 underline hover:text-green-800 text-sm"
      >
        How to play / About us
      </button>
      </div>
      <footer className="w-full py-4 border-t border-yellow-300 mt-auto" style={{ backgroundColor: '#FFFBF5' }}>
        <a
          href="https://famerlo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-gray-600 hover:text-gray-800 transition"
        >
          <span className="font-bold inline-flex items-center justify-center gap-1">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="inline-block" style={{ width: '1.2em', height: '1.2em', verticalAlign: 'middle' }}>
              <circle cx="7" cy="12" r="2" fill="#E8893C" />
              <circle cx="12" cy="12" r="2" fill="#E8893C" opacity="0.7" />
              <circle cx="17" cy="12" r="2" fill="#E8893C" opacity="0.4" />
            </svg>
            Famerlo - Family life, organized!
          </span><br />
          AI-powered family assistant for busy parents<br />
          <span className="underline">Click here to learn more</span>
        </a>
      </footer>
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
};

export default EmojiSudoku;
