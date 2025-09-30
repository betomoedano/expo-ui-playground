# Reactive SQLite Todos Feature

## Overview

This project now includes a complete reactive SQLite implementation with a todos demo app. The reactive wrapper automatically updates UI components when database changes occur, providing a seamless developer experience.

## What Was Created

### 1. Reactive SQLite Package (`/packages/reactive-sqlite/`)

A local package that wraps `expo-sqlite` to make it reactive:

- **`ReactiveQuery<T>`**: A query class that manages subscriptions and notifies listeners
- **`useReactiveQuery<T>`**: React hook for using reactive queries in components
- **`createReactiveDatabase()`**: Factory function to create a reactive database wrapper
- **Automatic Updates**: Components automatically re-render when data changes

**Key Features:**

- ✅ Type-safe TypeScript implementation
- ✅ Subscription-based reactivity
- ✅ Query caching and invalidation
- ✅ Loading and error states
- ✅ Zero dependencies (uses only expo-sqlite and React)

### 2. Todos Hook (`/hooks/useTodos.ts`)

A custom hook that demonstrates the reactive SQLite wrapper in action:

```typescript
const { todos, toggleTodo, deleteTodo, update, create } = useTodos();
```

**API:**

- `todos`: Array of todo items (automatically updates)
- `isLoading`: Loading state
- `error`: Error state
- `create(title)`: Add a new todo
- `update(id, title)`: Update a todo's title
- `toggleTodo(id)`: Toggle completion status
- `deleteTodo(id)`: Delete a single todo
- `deleteCompleted()`: Delete all completed todos
- `refresh()`: Manually refresh the list

### 3. Todos Screen (`/components/screens/todos.tsx`)

A beautiful, SwiftUI-style todo app with:

- ✨ Glass morphism design using `@expo/ui/swift-ui`
- 📊 Statistics showing active and completed counts
- ➕ Add new todos with inline form
- ✏️ Edit todos inline
- ✅ Toggle completion with animated checkbox
- 🗑️ Delete individual or all completed todos
- 🎨 Modern, polished UI with proper spacing and typography
- 📱 Native iOS SF Symbols icons

### 4. Navigation Integration

Added a new "Todos" tab to the main navigation:

- Tab icon: Checkmark circle (SF Symbol: `checkmark.circle.fill`)
- Positioned between "Basic" and "Settings" tabs
- Full screen layout with proper routing

## How It Works

### The Reactive Pattern

1. **Query Creation**: Create a reactive query with a unique key

   ```typescript
   const query = reactiveDb.createQuery("todos", async () => {
     return await db.getAllAsync("SELECT * FROM todos");
   });
   ```

2. **Component Usage**: Use the query in React components

   ```typescript
   const { data, isLoading } = useReactiveQuery(query);
   ```

3. **Data Updates**: When data changes, invalidate the query

   ```typescript
   await db.runAsync("INSERT INTO todos ...");
   await reactiveDb.invalidateQuery("todos");
   ```

4. **Auto-Update**: All subscribed components automatically re-render!

### Database Schema

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);
```

## File Structure

```
/Users/beto/Desktop/apps/expo-ui-playground/
├── packages/
│   └── reactive-sqlite/
│       ├── index.ts           # Core reactive wrapper
│       ├── package.json       # Package definition
│       └── README.md          # Package documentation
├── hooks/
│   └── useTodos.ts           # Todos hook implementation
├── components/
│   └── screens/
│       └── todos.tsx         # Todos UI screen
├── app/
│   ├── _layout.tsx          # Updated with todos tab
│   └── todos/
│       ├── _layout.tsx      # Todos stack navigator
│       └── index.tsx        # Todos route
└── tsconfig.json            # Updated with @local/* paths
```

## Configuration Changes

### `tsconfig.json`

Added path alias for local packages:

```json
{
  "compilerOptions": {
    "paths": {
      "@local/*": ["./packages/*"]
    }
  }
}
```

## Usage Example

```typescript
import { useTodos } from "@/hooks/useTodos";

function MyComponent() {
  const { todos, create, toggleTodo } = useTodos();

  return (
    <View>
      {todos.map((todo) => (
        <Pressable key={todo.id} onPress={() => toggleTodo(todo.id)}>
          <Text>{todo.title}</Text>
        </Pressable>
      ))}
      <Button onPress={() => create("New task")}>Add Todo</Button>
    </View>
  );
}
```

## Benefits

### For Developers

- **Simple API**: No complex state management needed
- **Automatic Updates**: UI stays in sync with database
- **Type Safety**: Full TypeScript support
- **Reusable**: Easy to extend for other features

### For Users

- **Fast**: Instant UI updates
- **Reliable**: SQLite-backed persistence
- **Beautiful**: Modern, native-feeling UI
- **Smooth**: No flickering or manual refreshes

## Testing the Feature

1. Open the Expo app
2. Navigate to the "Todos" tab
3. Add some todos using the input field
4. Toggle completion by tapping on todos
5. Edit todos using the pencil icon
6. Delete todos individually or clear all completed
7. Notice how all changes are instantly reflected and persist across app restarts!

## Extending the System

To create your own reactive hooks:

```typescript
// 1. Get the database
const { db, reactiveDb } = await getDatabase();

// 2. Create a query
const myQuery = reactiveDb.createQuery("mydata", async () => {
  return await db.getAllAsync("SELECT * FROM mytable");
});

// 3. Use in components
function MyComponent() {
  const { data } = useReactiveQuery(myQuery);
  // Component automatically updates when data changes!
}

// 4. Invalidate when data changes
async function updateData() {
  await db.runAsync("INSERT INTO mytable ...");
  await reactiveDb.invalidateQuery("mydata");
}
```

## Future Enhancements

Possible improvements:

- [ ] Add optimistic updates for better perceived performance
- [ ] Implement debounced invalidation for rapid changes
- [ ] Add query parameters support
- [ ] Create a query builder abstraction
- [ ] Add offline support with sync capabilities
- [ ] Implement undo/redo functionality
- [ ] Add categories and tags for todos
- [ ] Implement search and filtering

## Notes

- Database file: `todos.db` (stored in SQLite default location)
- WAL mode enabled for better performance
- All operations are async for non-blocking UI
- Singleton database pattern prevents multiple connections
- Proper cleanup with useEffect unsubscribe

---

Built with ❤️ using Expo, SQLite, and React Native
