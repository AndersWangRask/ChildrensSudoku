// Parental gate for links that leave the app.
//
// Apple's App Store rules for the Kids Category (guideline 1.3) require
// every link out of the app to sit behind a "parental gate": a check an
// adult passes in seconds but a young child can't easily pass. The usual
// accepted pattern is a question a pre-reader can't solve, so we ask
// for the product of two small numbers written out in WORDS ("five
// times seven"). The protection comes mainly from reading the words; the
// sum itself is deliberately easy. A first version used 12-19 x 3-9, and
// that proved too hard for adults without a calculator (Anders,
// 2026-11-21). The answer is typed on the number pad, so it can't be
// guessed by tapping a button.
//
// A birth-year question was considered and rejected. A child gets past
// it by typing any old year, and it asks for age data in a Kids Category
// app, which App Review looks for.
//
// Usage:
//   const [gate, openLinkWithGate] = useParentalGate();
//   ...onPress={() => openLinkWithGate('https://famerlo.com')}
//   ...and render {gate} inside the same view tree. Render it inside a
//   Modal's content when the link lives in that Modal, so the gate
//   stacks on top of it.
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];

// A in 2..6 and B in 2..10: products 4..60, all within the times tables
// adults know by heart. x1 is left out because "one times seven" is too
// easy to guess.
function newQuestion() {
  const a = 2 + Math.floor(Math.random() * 5);
  const b = 2 + Math.floor(Math.random() * 9);
  return { text: `${ONES[a]} times ${ONES[b]}`, answer: a * b };
}

export function ParentalGate({ visible, onPass, onCancel }) {
  const [question, setQuestion] = useState(newQuestion);
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  // A fresh question every time the gate opens, so a child who watched
  // a parent answer once can't reuse the answer.
  useEffect(() => {
    if (visible) {
      setQuestion(newQuestion());
      setInput('');
      setWrong(false);
    }
  }, [visible]);

  const submit = () => {
    if (parseInt(input, 10) === question.answer) {
      onPass();
    } else {
      setWrong(true);
      setInput('');
      setQuestion(newQuestion());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>Ask a grown-up 👋</Text>
          <Text style={styles.body}>This link opens a website. To continue, a grown-up must answer:</Text>
          <Text style={styles.question}>What is {question.text}?</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(t) => setInput(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={2}
            autoFocus
            onSubmitEditing={submit}
            accessibilityLabel="Answer"
          />
          {wrong && <Text style={styles.wrong}>Not quite. Here is a new question.</Text>}
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.ok, !input && styles.disabled]}
              onPress={submit}
              disabled={!input}
            >
              <Text style={styles.okText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Hook that owns the gate state: returns the gate element to render and a
// function that opens a URL only after the gate is passed.
export function useParentalGate() {
  const [pendingUrl, setPendingUrl] = useState(null);

  const openLinkWithGate = useCallback((url) => setPendingUrl(url), []);

  const gate = (
    <ParentalGate
      visible={pendingUrl !== null}
      onCancel={() => setPendingUrl(null)}
      onPass={() => {
        const url = pendingUrl;
        setPendingUrl(null);
        Linking.openURL(url);
      }}
    />
  );

  return [gate, openLinkWithGate];
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fefce8',
    borderRadius: 20,
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#15803d', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 16, color: '#374151', marginBottom: 12, textAlign: 'center' },
  question: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 12,
    backgroundColor: 'white',
    fontSize: 24,
    paddingVertical: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
  wrong: { color: '#b91c1c', textAlign: 'center', marginBottom: 8 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancel: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db' },
  cancelText: { fontSize: 16, color: '#374151', fontWeight: '600' },
  ok: { backgroundColor: '#16a34a' },
  okText: { fontSize: 16, color: 'white', fontWeight: 'bold' },
  disabled: { opacity: 0.5 },
});
