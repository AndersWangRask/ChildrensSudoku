import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import {
  EMOJI_SETS,
  DIFFICULTIES,
  gridLogic,
  selectRandomTheme,
  selectRandomEmojis,
  generateRandomSolution,
  removeEmojisBalanced,
  checkCompletedSections,
  isBoardComplete
} from '../../../packages/core/src/index.js';

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

const EmojiSudoku = () => {
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [currentEmojis, setCurrentEmojis] = useState([]);
  const [currentTheme, setCurrentTheme] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [gridSize, setGridSize] = useState(DIFFICULTIES.easy.gridSize);
  const [feedbackCell, setFeedbackCell] = useState(null);
  const [completedSections, setCompletedSections] = useState([]);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    generateNewPuzzle();
  }, []);

  const generateNewPuzzle = (newDifficulty = difficulty) => {
    const newTheme = selectRandomTheme();
    setCurrentTheme(newTheme);
    const newGridSize = DIFFICULTIES[newDifficulty].gridSize;
    setGridSize(newGridSize);
    const newEmojis = selectRandomEmojis(EMOJI_SETS[newTheme], newGridSize);
    setCurrentEmojis(newEmojis);
    const newSolution = generateRandomSolution(newEmojis, newGridSize);
    const newPuzzle = removeEmojisBalanced(newSolution, DIFFICULTIES[newDifficulty].numRemove, newGridSize);
    setBoard(newPuzzle);
    setSolution(newSolution);
    setIsComplete(false);
    setSelectedEmoji(null);
    setFeedbackCell(null);
    setCompletedSections([]);
    setErrorCount(0);
  };


  const handleCellClick = (row, col) => {
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
        }
      } else {
        setErrorCount(errorCount + 1); // Increment error count on incorrect placement
        setFeedbackCell({ row, col, correct: false });
        setTimeout(() => setFeedbackCell(null), 500);
      }
    }
  };



  return (
    <div className="flex flex-col items-center p-4 bg-yellow-100 rounded-lg">
      <h2 className="text-2xl mb-4 font-bold text-green-600">Emoji Sudoku: {currentTheme}</h2>
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
        {currentEmojis.map(emoji => (
          <Button
            key={emoji}
            onClick={() => setSelectedEmoji(emoji)}
            className={`w-10 h-10 text-xl ${selectedEmoji === emoji ? 'bg-yellow-300' : 'bg-white'}`}
          >
            {emoji}
          </Button>
        ))}
      </div>
      {/* Display error count below the row of emojis */}
      <div className="mb-2 text-lg text-red-600">
        Errors: {errorCount}
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
      {isComplete && (
        <div className="mt-4 text-xl font-bold text-green-600 animate-bounce">
          Congratulations! You solved the puzzle! 🎉
        </div>
      )}
    </div>
  );
};

export default EmojiSudoku;