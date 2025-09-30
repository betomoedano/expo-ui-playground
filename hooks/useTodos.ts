import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createReactiveDatabase,
  useReactiveQuery,
} from "../packages/reactive-sqlite";

export interface Todo {
  id: number;
  title: string;
  completed: number; // SQLite doesn't have boolean, so we use 0/1
  createdAt: number;
}

// Singleton database instance
let dbInstance: SQLite.SQLiteDatabase | null = null;
let reactiveDbInstance: ReturnType<typeof createReactiveDatabase> | null = null;

async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("todos.db");

    // Initialize database schema
    await dbInstance.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL
      );
    `);

    reactiveDbInstance = createReactiveDatabase(dbInstance);
  }

  return { db: dbInstance, reactiveDb: reactiveDbInstance! };
}

/**
 * Reactive hook for managing todos
 * Automatically updates when todos are added, updated, or deleted
 */
export function useTodos() {
  const [reactiveDb, setReactiveDb] = useState<ReturnType<
    typeof createReactiveDatabase
  > | null>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const initialized = useRef(false);

  // Initialize database
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    getDatabase().then(({ db, reactiveDb }) => {
      setDb(db);
      setReactiveDb(reactiveDb);
    });
  }, []);

  // Create reactive query for todos
  const todosQuery = useMemo(() => {
    if (!reactiveDb || !db) return null;
    return reactiveDb.createQuery<Todo>("todos", async () => {
      const todos = await db.getAllAsync<Todo>(
        "SELECT * FROM todos ORDER BY createdAt DESC"
      );
      return todos;
    });
  }, [reactiveDb, db]);

  // Use the reactive query hook
  const {
    data: todos,
    isLoading,
    error,
    refresh,
  } = useReactiveQuery(todosQuery);

  // Create a new todo
  const create = useCallback(
    async (title: string) => {
      if (!db || !reactiveDb) return;

      const createdAt = Date.now();
      await db.runAsync(
        "INSERT INTO todos (title, completed, createdAt) VALUES (?, ?, ?)",
        title,
        0,
        createdAt
      );

      // Invalidate query to trigger refresh
      await reactiveDb.invalidateQuery("todos");
    },
    [db, reactiveDb]
  );

  // Update a todo
  const update = useCallback(
    async (id: number, title: string) => {
      if (!db || !reactiveDb) return;

      await db.runAsync("UPDATE todos SET title = ? WHERE id = ?", title, id);

      await reactiveDb.invalidateQuery("todos");
    },
    [db, reactiveDb]
  );

  // Toggle todo completion
  const toggleTodo = useCallback(
    async (id: number) => {
      if (!db || !reactiveDb) return;

      await db.runAsync(
        "UPDATE todos SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END WHERE id = ?",
        id
      );

      await reactiveDb.invalidateQuery("todos");
    },
    [db, reactiveDb]
  );

  // Delete a todo
  const deleteTodo = useCallback(
    async (id: number) => {
      if (!db || !reactiveDb) return;

      await db.runAsync("DELETE FROM todos WHERE id = ?", id);

      await reactiveDb.invalidateQuery("todos");
    },
    [db, reactiveDb]
  );

  // Delete all completed todos
  const deleteCompleted = useCallback(async () => {
    if (!db || !reactiveDb) return;

    await db.runAsync("DELETE FROM todos WHERE completed = 1");

    await reactiveDb.invalidateQuery("todos");
  }, [db, reactiveDb]);

  return {
    todos: todos || [],
    isLoading: !db || isLoading,
    error,
    create,
    update,
    toggleTodo,
    deleteTodo,
    deleteCompleted,
    refresh,
  };
}
