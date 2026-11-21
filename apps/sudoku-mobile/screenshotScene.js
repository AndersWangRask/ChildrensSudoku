// Screenshot mode: start the app directly in a chosen state, so that App
// Store screenshots can be taken in the simulator without tapping.
//
// It is active only when the JS bundle is built with
//   EXPO_PUBLIC_SCREENSHOT_SCENE=<scene>
// Expo inlines EXPO_PUBLIC_* variables at bundle time. Store builds never
// set it, so SCREENSHOT_SCENE is undefined there and the app starts
// normally. Scenes:
//   medium   fresh 6x6 puzzle, one fruit picked up
//   hard     9x9 puzzle about half solved, one fruit picked up
//   mistake  4x4 puzzle with two sad faces (the friendly error system)
//   solved   solved 6x6 puzzle, congratulations shown
//   howto    How to Play / About screen open
//
// The puzzles are random. Rebuild to get a different one.
import {
  DIFFICULTIES,
  selectRandomFruits,
  generateRandomSolution,
  removeEmojisBalanced,
  checkCompletedSections,
} from '@famerlo/sudoku-core';

export const SCREENSHOT_SCENE = process.env.EXPO_PUBLIC_SCREENSHOT_SCENE || null;

const SCENE_DIFFICULTY = { medium: 'medium', hard: 'hard', mistake: 'easy', solved: 'medium', howto: 'easy' };

// Returns the full game state for a scene, or null for an unknown scene.
export function buildScreenshotScene(scene) {
  const difficulty = SCENE_DIFFICULTY[scene];
  if (!difficulty) return null;

  const gridSize = DIFFICULTIES[difficulty].gridSize;
  const fruits = selectRandomFruits(gridSize);
  const solution = generateRandomSolution(fruits, gridSize);
  let board = removeEmojisBalanced(solution, DIFFICULTIES[difficulty].numRemove, gridSize);
  let completedSections = [];

  if (scene === 'hard') {
    // Fill about half of the empty cells, and record the rows, columns
    // and boxes this completes, as real play would.
    board = board.map(row => [...row]);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (board[r][c] === null && Math.random() < 0.5) {
          board[r][c] = solution[r][c];
          completedSections = checkCompletedSections(board, r, c, completedSections, gridSize);
        }
      }
    }
  }
  if (scene === 'solved') {
    board = solution.map(row => [...row]);
  }

  // Pick up a fruit that still has empty cells, so the picker shows a selection.
  const openFruit = fruits.find(f => board.some((row, r) => row.some((cell, c) => cell === null && solution[r][c] === f)));

  return {
    difficulty,
    gridSize,
    fruits,
    solution,
    board,
    completedSections,
    selectedEmoji: scene === 'solved' || scene === 'howto' ? null : openFruit || null,
    isComplete: scene === 'solved',
    errors: scene === 'mistake'
      ? [{ id: 1, emoji: '😢' }, { id: 2, emoji: '🥺' }]
      : [],
    showHowToPlay: scene === 'howto',
  };
}
