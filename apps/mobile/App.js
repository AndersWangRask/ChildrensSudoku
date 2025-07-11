import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
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
} from '../../packages/core/src/index.js';

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.min((width - 60) / 9, 40); // Responsive cell size

export default function App() {
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

  const handleCellPress = (row, col) => {
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
          Alert.alert('Congratulations!', 'You solved the puzzle! 🎉');
        }
      } else {
        setErrorCount(errorCount + 1);
        setFeedbackCell({ row, col, correct: false });
        setTimeout(() => setFeedbackCell(null), 500);
      }
    }
  };

  const getCellStyle = (rowIndex, colIndex) => {
    const isFeedbackCell = feedbackCell && feedbackCell.row === rowIndex && feedbackCell.col === colIndex;
    const isErrorCell = isFeedbackCell && !feedbackCell.correct;
    const isEmptyCell = board[rowIndex][colIndex] === null;
    
    const baseStyle = {
      width: CELL_SIZE,
      height: CELL_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#86efac',
    };

    // Add box borders based on grid size
    if (gridSize === 4) {
      if (rowIndex === 1) baseStyle.borderBottomWidth = 2;
      if (colIndex === 1) baseStyle.borderRightWidth = 2;
    } else if (gridSize === 6) {
      if (rowIndex === 1 || rowIndex === 3) baseStyle.borderBottomWidth = 2;
      if (colIndex === 2) baseStyle.borderRightWidth = 2;
    } else if (gridSize === 9) {
      if (rowIndex === 2 || rowIndex === 5) baseStyle.borderBottomWidth = 2;
      if (colIndex === 2 || colIndex === 5) baseStyle.borderRightWidth = 2;
    }

    if (isErrorCell) {
      baseStyle.backgroundColor = '#ef4444';
    } else if (isEmptyCell) {
      baseStyle.backgroundColor = '#fef3c7';
    } else {
      baseStyle.backgroundColor = '#ffffff';
    }

    // Check if cell is in completed section
    const inCompletedSection = completedSections.some(section => {
      if (section.type === 'row') return section.index === rowIndex;
      if (section.type === 'col') return section.index === colIndex;
      if (section.type === 'box') {
        return rowIndex >= section.row && 
               rowIndex < section.row + (section.height || gridLogic[gridSize].boxSize) &&
               colIndex >= section.col && 
               colIndex < section.col + (section.width || gridLogic[gridSize].boxSize);
      }
      return false;
    });

    if (inCompletedSection) {
      baseStyle.backgroundColor = '#fef3c7';
    }

    return baseStyle;
  };

  const renderBoard = () => {
    return (
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={getCellStyle(rowIndex, colIndex)}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              >
                <Text style={styles.cellText}>{cell}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderEmojiButtons = () => {
    return (
      <View style={styles.emojiContainer}>
        {currentEmojis.map(emoji => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.emojiButton,
              selectedEmoji === emoji && styles.selectedEmojiButton
            ]}
            onPress={() => setSelectedEmoji(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDifficultyButtons = () => {
    return (
      <View style={styles.difficultyContainer}>
        {Object.keys(DIFFICULTIES).map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              difficulty === level && styles.selectedDifficultyButton
            ]}
            onPress={() => {
              setDifficulty(level);
              generateNewPuzzle(level);
            }}
          >
            <Text style={[
              styles.difficultyText,
              difficulty === level && styles.selectedDifficultyText
            ]}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Emoji Sudoku: {currentTheme}</Text>
        {renderBoard()}
        {renderEmojiButtons()}
        <Text style={styles.errorText}>Errors: {errorCount}</Text>
        {renderDifficultyButtons()}
        <TouchableOpacity
          style={styles.newPuzzleButton}
          onPress={() => generateNewPuzzle(difficulty)}
        >
          <Text style={styles.newPuzzleText}>New Puzzle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef08a',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 20,
  },
  board: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
  },
  cellText: {
    fontSize: 20,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  emojiButton: {
    width: 50,
    height: 50,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedEmojiButton: {
    backgroundColor: '#fde047',
    borderColor: '#facc15',
  },
  emojiText: {
    fontSize: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    marginTop: 10,
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  difficultyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedDifficultyButton: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  difficultyText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDifficultyText: {
    color: '#ffffff',
  },
  newPuzzleButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  newPuzzleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});