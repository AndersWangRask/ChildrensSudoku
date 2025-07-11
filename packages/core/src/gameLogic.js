export const EMOJI_SETS = {
  fruits: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍍', '🥝', '🍐', '🍑', '🍒', '🥭', '🫐', '🍋', '🍈', '🍏'],
  vehicles: ['🚗', '🚌', '🚲', '🏍️', '🚁', '🚂', '🚢', '🛩️', '🚜', '🚓', '🚑', '🚒', '🛵', '🚠', '🛶', '🛸'],
  animals: ['🐶', '🐱', '🐵', '🦁', '🐘', '🦒', '🐧', '🦋', '🐸', '🦜', '🐬', '🦘', '🦥', '🦊', '🐼', '🦖'],
  weather: ['☀️', '☁️', '🌧️', '❄️', '🌈', '⚡', '🌪️', '🌊', '🌁', '🌀', '🌤️', '🌥️', '🌦️', '🌨️', '🌩️', '🌫️'],
  sports: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐', '🏓', '🏸', '🥊', '🏊', '🏄', '🚴', '⛷️', '🏋️', '🤸', '🤺'],
  food: ['🍕', '🍔', '🌭', '🍟', '🌮', '🍣', '🍜', '🍝', '🍳', '🥐', '🥨', '🥞', '🧇', '🥯', '🥪', '🌯'],
  faces: ['😀', '😂', '🥳', '😎', '🤔', '😍', '😴', '🤯', '🥸', '🤠', '🤡', '👻', '👽', '🤖', '💩', '🎃'],
  plants: ['🌻', '🌼', '🌸', '🌺', '🌷', '🌹', '🍀', '🍁', '🍂', '🍃', '🌵', '🌴', '🌲', '🌳', '🍄', '🌱'],
  objects: ['📱', '💻', '⌚', '📷', '🔋', '💡', '🔨', '🧲', '🔭', '🔬', '📚', '✏️', '🖍️', '🧷', '🧵', '🧶'],
  flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇳', '🇦🇺', '🇨🇦', '🇯🇵', '🇰🇷', '🇬🇧', '🇺🇸', '🇪🇺'],
  music: ['🎵', '🎶', '🎼', '🎹', '🥁', '🎸', '🎻', '🎺', '🎷', '🪕', '🪗', '🎤', '🎧', '📻', '🔉', '🔊'],
  space: ['🌙', '🌍', '🪐', '🌟', '⭐', '💫', '☄️', '🌠', '🌌', '🚀', '🛸', '🔭', '🌑', '🌕']
};

export const DIFFICULTIES = {
  easy: { gridSize: 4, numRemove: [4, 6] },
  medium: { gridSize: 6, numRemove: [15, 20] },
  hard: { gridSize: 9, numRemove: [30, 37] }
};

// Grid-specific logic
export const gridLogic = {
  4: {
    boxSize: 2,
    isValidMove: (board, row, col, emoji) => {
      // Check row and column
      for (let i = 0; i < 4; i++) {
        if (board[row][i] === emoji || board[i][col] === emoji) return false;
      }
      // Check 2x2 box
      const boxRow = Math.floor(row / 2) * 2;
      const boxCol = Math.floor(col / 2) * 2;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (board[boxRow + i][boxCol + j] === emoji) return false;
        }
      }
      return true;
    }
  },
  6: {
    boxSize: 2,
    isValidMove: (board, row, col, emoji) => {
      // Check row and column
      for (let i = 0; i < 6; i++) {
        if (board[row][i] === emoji || board[i][col] === emoji) return false;
      }
      // Check 2x3 box
      const boxRow = Math.floor(row / 2) * 2;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === emoji) return false;
        }
      }
      return true;
    }
  },
  9: {
    boxSize: 3,
    isValidMove: (board, row, col, emoji) => {
      // Check row and column
      for (let i = 0; i < 9; i++) {
        if (board[row][i] === emoji || board[i][col] === emoji) return false;
      }
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === emoji) return false;
        }
      }
      return true;
    }
  }
};

export const selectRandomTheme = () => {
  const themes = Object.keys(EMOJI_SETS);
  return themes[Math.floor(Math.random() * themes.length)];
};

export const selectRandomEmojis = (emojiSet, size) => {
  const shuffled = [...emojiSet].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
};

export const generateRandomSolution = (emojis, size) => {
  const board = Array(size).fill().map(() => Array(size).fill(null));
  fillBoard(board, emojis, size);
  return board;
};

const fillBoard = (board, emojis, size) => {
  const fillCell = (row, col) => {
    if (col === size) {
      col = 0;
      row++;
      if (row === size) return true; // Board is filled
    }

    if (board[row][col] !== null) return fillCell(row, col + 1);

    const shuffledEmojis = [...emojis].sort(() => 0.5 - Math.random());

    for (let emoji of shuffledEmojis) {
      if (gridLogic[size].isValidMove(board, row, col, emoji)) {
        board[row][col] = emoji;
        if (fillCell(row, col + 1)) return true;
        board[row][col] = null; // Backtrack
      }
    }

    return false;
  };

  fillCell(0, 0);
  return board;
};

export const removeEmojisBalanced = (solvedPuzzle, [minRemove, maxRemove], size) => {
  const puzzle = JSON.parse(JSON.stringify(solvedPuzzle));
  const numToRemove = minRemove + Math.floor(Math.random() * (maxRemove - minRemove + 1));
  
  const positions = Array(size * size).fill().map((_, index) => [Math.floor(index / size), index % size]);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < numToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = null;
  }

  return puzzle;
};

export const checkCompletedSections = (board, row, col, completedSections, size) => {
  const newCompletedSections = [...completedSections];
  const { boxSize } = gridLogic[size];
  const boxHeight = boxSize;
  const boxWidth = (size === 6 ? 3 : boxSize);

  // Check row
  if (board[row].every(cell => cell !== null)) {
    newCompletedSections.push({ type: 'row', index: row });
  }

  // Check column
  if (board.every(r => r[col] !== null)) {
    newCompletedSections.push({ type: 'col', index: col });
  }

  // Check box
  const boxRow = Math.floor(row / boxHeight) * boxHeight;
  const boxCol = Math.floor(col / boxWidth) * boxWidth;
  let boxComplete = true;
  for (let i = 0; i < boxHeight; i++) {
    for (let j = 0; j < boxWidth; j++) {
      if (board[boxRow + i][boxCol + j] === null) {
        boxComplete = false;
        break;
      }
    }
    if (!boxComplete) break;
  }
  if (boxComplete) {
    newCompletedSections.push({
      type: 'box',
      row: boxRow,
      col: boxCol,
      height: boxHeight,
      width: boxWidth
    });
  }

  return newCompletedSections;
};

export const isBoardComplete = (board) => {
  return board.every(row => row.every(cell => cell !== null));
};