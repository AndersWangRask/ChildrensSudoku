import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
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

const { width } = Dimensions.get('window');
const CELL_SIZE = Math.min((width - 60) / 9, 40);

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

// Simple beep sound generation using expo-av
async function playBeep(frequency = 440, durationMs = 200) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/wav;base64,${generateWavBase64(frequency, durationMs)}` },
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {
    // Sound is non-critical; silently ignore errors
  }
}

function generateWavBase64(frequency, durationMs) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationMs / 1000);
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / (durationMs / 1000));
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function playCorrectSound() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  playBeep(523, 100);
  setTimeout(() => playBeep(659, 150), 100);
}

async function playWrongSound() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  playBeep(200, 250);
}

async function playSectionCompleteSound() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  playBeep(523, 100);
  setTimeout(() => playBeep(659, 100), 80);
  setTimeout(() => playBeep(784, 150), 160);
}

async function playPuzzleCompleteSound() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const notes = [523, 659, 784, 880, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 200), i * 120);
  });
}

function HowToPlay({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={howToStyles.container}>
        <ScrollView contentContainerStyle={howToStyles.content}>
          <Text style={howToStyles.title}>How to Play 🍎</Text>

          <Text style={howToStyles.sectionTitle}>The Rules</Text>
          <Text style={howToStyles.bullet}>• Fill every empty cell with a fruit.</Text>
          <Text style={howToStyles.bullet}>• Each row must have every fruit exactly once.</Text>
          <Text style={howToStyles.bullet}>• Each column must have every fruit exactly once.</Text>
          <Text style={howToStyles.bullet}>• Each box (thick borders) must have every fruit exactly once.</Text>

          <Text style={howToStyles.sectionTitle}>How to Play</Text>
          <Text style={howToStyles.bullet}>1. Tap a fruit button below the board to pick it up.</Text>
          <Text style={howToStyles.bullet}>2. Tap an empty cell on the board to place it.</Text>
          <Text style={howToStyles.bullet}>3. If correct, the fruit stays. If wrong, you get a sad face!</Text>
          <Text style={howToStyles.bullet}>4. When all cells for a fruit are filled, its button gets a checkmark.</Text>

          <Text style={howToStyles.sectionTitle}>Watch Out!</Text>
          <Text style={howToStyles.bullet}>• Each mistake adds a sad emoji that lasts 30 seconds.</Text>
          <Text style={howToStyles.bullet}>• If you have 5 sad emojis at the same time, it's game over!</Text>
          <Text style={howToStyles.bullet}>• Press New Puzzle to start fresh any time.</Text>

          <Text style={howToStyles.sectionTitle}>Difficulty</Text>
          <Text style={howToStyles.bullet}>• Easy — 4x4 grid (great for beginners!)</Text>
          <Text style={howToStyles.bullet}>• Medium — 6x6 grid</Text>
          <Text style={howToStyles.bullet}>• Hard — 9x9 grid (classic Sudoku size)</Text>

          <TouchableOpacity style={howToStyles.closeButton} onPress={onClose}>
            <Text style={howToStyles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const howToStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefce8',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 18,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    paddingLeft: 8,
  },
  closeButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default function App() {
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

  const handleCellPress = (row, col) => {
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
          Alert.alert('Congratulations!', 'You solved the puzzle! 🎉');
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

  const renderFruitButtons = () => {
    return (
      <View style={styles.fruitContainer}>
        {currentFruits.map(fruit => {
          const completed = isFruitComplete(fruit, board, solution);
          return (
            <TouchableOpacity
              key={fruit}
              style={[
                styles.fruitButton,
                selectedEmoji === fruit && !completed && styles.selectedFruitButton,
                completed && styles.completedFruitButton
              ]}
              onPress={() => !completed && setSelectedEmoji(fruit)}
              disabled={completed}
            >
              <Text style={styles.fruitText}>{fruit}</Text>
              {completed && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStatusArea = () => {
    if (isComplete) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.completeText}>Congratulations! You solved it! 🎉</Text>
        </View>
      );
    }
    if (isGameOver) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.gameOverText}>Game Over! Too many mistakes! 😢</Text>
        </View>
      );
    }
    return (
      <View style={styles.statusContainer}>
        {activeErrors.map(error => (
          <Text key={error.id} style={styles.errorEmoji}>{error.emoji}</Text>
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
        <Text style={styles.title}>Free Fruit Sudoku for Kids 🍎</Text>
        {renderBoard()}
        {renderFruitButtons()}
        {renderStatusArea()}
        {renderDifficultyButtons()}
        <TouchableOpacity
          style={styles.newPuzzleButton}
          onPress={() => generateNewPuzzle(difficulty)}
        >
          <Text style={styles.newPuzzleText}>New Puzzle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.howToPlayLink}
          onPress={() => setShowHowToPlay(true)}
        >
          <Text style={styles.howToPlayText}>How to play</Text>
        </TouchableOpacity>
      </ScrollView>
      <HowToPlay visible={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
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
  fruitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  fruitButton: {
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
  selectedFruitButton: {
    backgroundColor: '#fde047',
    borderColor: '#facc15',
  },
  completedFruitButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    opacity: 0.7,
  },
  fruitText: {
    fontSize: 24,
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    minHeight: 36,
    flexWrap: 'wrap',
  },
  errorEmoji: {
    fontSize: 28,
    marginHorizontal: 2,
  },
  gameOverText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  completeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
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
  howToPlayLink: {
    marginTop: 16,
  },
  howToPlayText: {
    color: '#16a34a',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
