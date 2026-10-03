import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  chooseDeck,
  movePage,
  moveQuestion,
  questionAt,
  removed,
  saveAnswer,
  type Deck,
  type SavedBook,
} from "./src/book";
import { loadBook, saveBook } from "./src/store";

type Tab = "ask" | "book";

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("ask");
  const [book, setBook] = useState<SavedBook | null>(null);
  const [note, setNote] = useState("Ask someone.");
  const [draft, setDraft] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    loadBook()
      .then((saved) => {
        setBook(saved);
        setNote(saved.entries.length > 0 ? "Saved answers loaded." : "Ask someone.");
      })
      .catch(() => {
        setBook(null);
        setNote("Could not read the saved answers.");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !book) return;
    saveBook(book).catch(() => setNote("Could not save the answers."));
  }, [ready, book]);

  if (!ready || !book) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <Text style={styles.loading}>Loading the book</Text>
        </View>
      </SafeAreaView>
    );
  }

  const question = questionAt(book);
  const entry = book.entries[book.page];

  function onSave() {
    Keyboard.dismiss();
    const result = saveAnswer(book!, draft, `e-${Date.now()}`);
    setBook(result.book);
    setNote(result.note);
    if (result.note === "Saved.") setDraft("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Text style={styles.title}>Said Tonight</Text>
        <Text style={styles.note}>{note}</Text>
        {tab === "ask" ? (
          <View style={styles.panel}>
            <Text style={styles.question}>{question}</Text>
            <Text style={styles.note}>{draft.trim() ? draft.trim() : "Nothing typed yet."}</Text>
            <BigButton label="Save answer" filled onPress={onSave} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              accessibilityLabel="Their answer"
              placeholder="Type what they said"
              placeholderTextColor="#6D6458"
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="sentences"
              style={styles.input}
            />
            <View style={styles.row}>
              <BigButton label="Kids" filled={book.deck === "kids"} inRow onPress={() => onDeck("kids")} />
              <BigButton label="Family" filled={book.deck === "family"} inRow onPress={() => onDeck("family")} />
              <BigButton label="Seniors" filled={book.deck === "seniors"} inRow onPress={() => onDeck("seniors")} />
            </View>
            <View style={styles.row}>
              <BigButton label="Previous question" inRow onPress={() => onMove(-1)} />
              <BigButton label="Next question" inRow onPress={() => onMove(1)} />
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            {book.entries.length === 0 || !entry ? (
              <>
                <Text style={styles.question}>No answers yet.</Text>
                <BigButton label="Ask someone" filled onPress={() => setTab("ask")} />
              </>
            ) : (
              <>
                <Text style={styles.question}>{entry.question}</Text>
                <Text style={styles.answer}>{entry.answer}</Text>
                <Text style={styles.note}>{`${book.page + 1} of ${book.entries.length}`}</Text>
                <View style={styles.row}>
                  <BigButton label="Previous page" inRow onPress={() => onPage(-1)} />
                  <BigButton label="Next page" inRow onPress={() => onPage(1)} />
                </View>
                {confirmRemove ? (
                  <View style={styles.row}>
                    <BigButton label="Confirm remove" filled inRow onPress={onConfirmRemove} />
                    <BigButton label="Cancel remove" inRow onPress={onCancelRemove} />
                  </View>
                ) : (
                  <BigButton label="Remove this" onPress={() => setConfirmRemove(true)} />
                )}
              </>
            )}
          </View>
        )}
      </View>
      <View style={styles.tabs}>
        <TabButton label="Ask" selected={tab === "ask"} onPress={() => { setTab("ask"); setConfirmRemove(false); }} />
        <TabButton label="Book" selected={tab === "book"} onPress={() => { setTab("book"); setConfirmRemove(false); }} />
      </View>
    </SafeAreaView>
  );

  function onDeck(deck: Deck) {
    const result = chooseDeck(book!, deck);
    setBook(result.book);
    setNote(result.note);
  }

  function onMove(delta: -1 | 1) {
    const result = moveQuestion(book!, delta);
    setBook(result.book);
    setNote(result.note);
  }

  function onPage(delta: -1 | 1) {
    const result = movePage(book!, delta);
    setBook(result.book);
    setNote(result.note);
    setConfirmRemove(false);
  }

  function onConfirmRemove() {
    setBook(removed(book!));
    setConfirmRemove(false);
    setNote("Answer removed.");
  }

  function onCancelRemove() {
    setConfirmRemove(false);
    setNote("Remove canceled.");
  }
}

function BigButton({
  label,
  onPress,
  filled,
  inRow,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  inRow?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, inRow && styles.buttonRow, filled && styles.buttonFilled]}
    >
      <Text style={[styles.buttonText, filled && styles.buttonTextFilled]}>{label}</Text>
    </Pressable>
  );
}

function TabButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tab, selected && styles.tabOn]}
    >
      <Text style={[styles.tabText, selected && styles.tabTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F0E6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { fontSize: 28, fontWeight: "800", color: "#1C2430" },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "#1C2430" },
  note: { fontSize: 18, color: "#4E463C", minHeight: 28, marginTop: 4 },
  panel: { flex: 1, gap: 8, marginTop: 8 },
  question: { fontSize: 28, fontWeight: "800", color: "#1C2430", lineHeight: 34 },
  answer: { fontSize: 32, fontWeight: "800", color: "#9A3412", lineHeight: 38 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E4D3BE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    color: "#1C2430",
  },
  row: { flexDirection: "row", gap: 8 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#9A3412",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  buttonRow: { flex: 1 },
  buttonFilled: { backgroundColor: "#9A3412" },
  buttonText: { fontSize: 16, fontWeight: "800", color: "#9A3412", textAlign: "center" },
  buttonTextFilled: { color: "#FFFFFF" },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E4D3BE",
  },
  tab: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EADFCF" },
  tabOn: { backgroundColor: "#1C2430" },
  tabText: { fontSize: 18, fontWeight: "800", color: "#1C2430" },
  tabTextOn: { color: "#F6F0E6" },
});
