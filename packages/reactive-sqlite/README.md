# @local/reactive-sqlite

A reactive wrapper for expo-sqlite that provides automatic UI updates when database changes occur.

## Features

- 🔄 **Reactive Updates**: Components automatically re-render when data changes
- 🪝 **React Hooks**: Simple hook-based API for React components
- 🚀 **Lightweight**: Minimal overhead, built on top of expo-sqlite
- 🎯 **Type-Safe**: Full TypeScript support
- 💾 **Query Caching**: Efficient query result caching and invalidation

## Installation

This is a local package, no installation needed. Just import and use.

## Basic Usage

### 1. Create a Reactive Database

```typescript
import * as SQLite from "expo-sqlite";
import {
  createReactiveDatabase,
  useReactiveQuery,
} from "@local/reactive-sqlite";

// Initialize database
const db = await SQLite.openDatabaseAsync("myapp.db");
const reactiveDb = createReactiveDatabase(db);
```

### 2. Create Reactive Queries

```typescript
// Create a query that will automatically update components
const usersQuery = reactiveDb.createQuery("users", async () => {
  return await db.getAllAsync("SELECT * FROM users");
});
```

### 3. Use in React Components

```typescript
function UsersList() {
  const { data: users, isLoading, error } = useReactiveQuery(usersQuery);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View>
      {users.map((user) => (
        <UserItem key={user.id} user={user} />
      ))}
    </View>
  );
}
```

### 4. Trigger Updates

```typescript
async function addUser(name: string) {
  await db.runAsync("INSERT INTO users (name) VALUES (?)", name);

  // Automatically update all components using this query
  await reactiveDb.invalidateQuery("users");
}
```

## API Reference

### `createReactiveDatabase(db: SQLiteDatabase)`

Creates a reactive wrapper around an SQLite database.

**Returns:** `ReactiveDatabase`

### `ReactiveDatabase.createQuery<T>(key: string, queryFn: () => Promise<T[]>)`

Creates a reactive query that can be used with `useReactiveQuery`.

**Parameters:**

- `key`: Unique identifier for the query
- `queryFn`: Async function that returns query results

**Returns:** `ReactiveQuery<T>`

### `ReactiveDatabase.invalidateQuery(key: string)`

Invalidates a query, causing all components using it to refresh.

**Parameters:**

- `key`: Query identifier

### `useReactiveQuery<T>(query: ReactiveQuery<T> | null)`

React hook to use a reactive query in a component. Accepts null to handle cases where the query hasn't been initialized yet.

**Parameters:**

- `query`: ReactiveQuery instance or null

**Returns:**

- `data`: Query results
- `isLoading`: Loading state
- `error`: Error state
- `refresh`: Manual refresh function

## Example: Todo App

See `/hooks/useTodos.ts` and `/components/screens/todos.tsx` for a complete example implementation.

## How It Works

1. **Query Creation**: Queries are registered with a unique key
2. **Subscription**: Components subscribe to query changes via React hooks
3. **Invalidation**: When data changes, invalidate the query
4. **Auto-Update**: All subscribed components automatically re-render with new data

## Benefits

- **Separation of Concerns**: Database logic separate from UI components
- **Automatic Updates**: No manual state management needed
- **Performance**: Only affected components re-render
- **Developer Experience**: Simple, intuitive API

## License

MIT
