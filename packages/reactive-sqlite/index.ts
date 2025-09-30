import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

type Listener<T> = (data: T[]) => void;
type QueryFunction<T> = () => Promise<T[]>;

/**
 * Reactive SQLite wrapper that automatically updates React components
 * when database changes occur
 */
export class ReactiveQuery<T> {
  private listeners: Set<Listener<T>> = new Set();
  private currentData: T[] = [];
  private queryFn: QueryFunction<T>;

  constructor(queryFn: QueryFunction<T>) {
    this.queryFn = queryFn;
  }

  /**
   * Subscribe to data changes
   */
  subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of data change
   */
  private notify() {
    this.listeners.forEach((listener) => listener(this.currentData));
  }

  /**
   * Refresh data from database and notify subscribers
   */
  async refresh() {
    try {
      this.currentData = await this.queryFn();
      this.notify();
    } catch (error) {
      console.error("Error refreshing reactive query:", error);
      throw error;
    }
  }

  /**
   * Get current data without triggering refresh
   */
  getCurrentData() {
    return this.currentData;
  }
}

/**
 * Hook to use reactive SQLite queries in React components
 */
export function useReactiveQuery<T>(query: ReactiveQuery<T> | null): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!query) return;
    try {
      setIsLoading(true);
      setError(null);
      await query.refresh();
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    if (!query) return;

    mounted.current = true;

    // Subscribe to changes
    const unsubscribe = query.subscribe((newData) => {
      if (mounted.current) {
        setData(newData);
      }
    });

    // Initial load
    refresh();

    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [query, refresh]);

  return { data, isLoading, error, refresh };
}

/**
 * Create a reactive database wrapper
 */
export function createReactiveDatabase(db: SQLite.SQLiteDatabase) {
  const queries = new Map<string, ReactiveQuery<any>>();

  return {
    /**
     * Create or get a reactive query
     */
    createQuery<T>(key: string, queryFn: QueryFunction<T>): ReactiveQuery<T> {
      if (!queries.has(key)) {
        queries.set(key, new ReactiveQuery(queryFn));
      }
      return queries.get(key)!;
    },

    /**
     * Invalidate a query to trigger refresh
     */
    async invalidateQuery(key: string) {
      const query = queries.get(key);
      if (query) {
        await query.refresh();
      }
    },

    /**
     * Invalidate multiple queries
     */
    async invalidateQueries(keys: string[]) {
      await Promise.all(keys.map((key) => this.invalidateQuery(key)));
    },

    /**
     * Get the underlying database
     */
    getDatabase() {
      return db;
    },
  };
}

export type ReactiveDatabase = ReturnType<typeof createReactiveDatabase>;
