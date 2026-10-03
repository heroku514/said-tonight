import AsyncStorage from "@react-native-async-storage/async-storage";
import { EMPTY_BOOK, parseBook, type SavedBook } from "./book";

const KEY = "said-tonight-v1";

export async function loadBook(): Promise<SavedBook> {
  const raw = await AsyncStorage.getItem(KEY);
  return parseBook(raw);
}

export async function saveBook(book: SavedBook): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(book));
}

export { EMPTY_BOOK };
