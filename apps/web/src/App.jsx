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
  isBoardComplete
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
      return getCellClassNameHelper(rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 2);
    }
  },
  6: {
    getCellClassName: (rowIndex, colIndex, board, feedbackCell, completedSections) => {
      const isBoxBorder = rowIndex === 1 || rowIndex === 3;
      const isBoxRightBorder = colIndex === 2;
      return getCellClassNameHelper(rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 2);
    }
  },
  9: {
    getCellClassName: (rowIndex, colIndex, board, feedbackCell, completedSections) => {
      const isBoxBorder = rowIndex === 2 || rowIndex === 5;
      const isBoxRightBorder = colIndex === 2 || colIndex === 5;
      return getCellClassNameHelper(rowIndex, colIndex, board, feedbackCell, completedSections, isBoxBorder, isBoxRightBorder, 3);
    }
  }
};

const getCellClassNameHelper = (
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

  return `w-12 h-12 flex items-center justify-center text-2xl
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
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-yellow-50 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
      <h2 className="text-2xl font-bold text-green-600 mb-4">How to Play 🍎</h2>

      <h3 className="text-lg font-bold text-green-700 mt-3 mb-1">The Rules</h3>
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

      <button
        onClick={onClose}
        className="mt-6 w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-600 transition"
      >
        Got it!
      </button>
    </div>
  </div>
);

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
  const errorTimersRef = useRef([]);

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

  const handleCellClick = (row, col) => {
    if (isGameOver || isComplete) return;
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
    <div className="flex flex-col items-center p-4 bg-yellow-100 rounded-lg">
      <h2 className="text-2xl mb-4 font-bold text-green-600">Free Fruit Sudoku for Kids 🍎</h2>
      <div className={`grid grid-cols-${gridSize} gap-0 mb-4 p-2 bg-white rounded-lg shadow-md`}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={gridStyling[gridSize].getCellClassName(rowIndex, colIndex, board, feedbackCell, completedSections)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      <div className="flex flex-wrap justify-center space-x-2 mb-4">
        {currentFruits.map(fruit => {
          const completed = isFruitComplete(fruit, board, solution);
          return (
            <Button
              key={fruit}
              onClick={() => !completed && setSelectedEmoji(fruit)}
              className={`w-10 h-10 text-xl relative ${
                completed
                  ? 'bg-green-100 opacity-70 cursor-default'
                  : selectedEmoji === fruit
                  ? 'bg-yellow-300'
                  : 'bg-white'
              }`}
              disabled={completed}
            >
              {fruit}
              {completed && (
                <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  ✓
                </span>
              )}
            </Button>
          );
        })}
      </div>
      <div className="mb-2 h-10 flex items-center justify-center space-x-1">
        {isComplete ? (
          <span className="text-xl font-bold text-green-600 animate-bounce">
            Congratulations! You solved the puzzle! 🎉
          </span>
        ) : isGameOver ? (
          <span className="text-xl font-bold text-red-600 animate-pulse">
            Game Over! Too many mistakes! 😢
          </span>
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
      </div>
      <button
        onClick={() => setShowHowToPlay(true)}
        className="mt-2 text-green-600 underline hover:text-green-800 text-sm"
      >
        How to play
      </button>
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
};

export default EmojiSudoku;
