import { useTodos } from "@/hooks/useTodos";
import { Button as ButtonPrimitive, Host } from "@expo/ui/swift-ui";
import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";

export default function TodosScreen() {
  const {
    todos,
    isLoading,
    create,
    update,
    toggleTodo,
    deleteTodo,
    deleteCompleted,
  } = useTodos();

  const [newTodoText, setNewTodoText] = React.useState("");
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  const handleCreate = async () => {
    if (newTodoText.trim()) {
      await create(newTodoText.trim());
      setNewTodoText("");
    }
  };

  const handleEdit = (id: number, currentTitle: string) => {
    setEditingId(id);
    setEditingText(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (editingId !== null && editingText.trim()) {
      await update(editingId, editingText.trim());
      setEditingId(null);
      setEditingText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const completedCount = todos.filter((t) => t.completed === 1).length;
  const activeCount = todos.length - completedCount;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading todos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Todo List</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Add New Todo */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor="#999"
          value={newTodoText}
          onChangeText={setNewTodoText}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        <Button
          variant="glassProminent"
          systemImage="plus.circle.fill"
          onPress={handleCreate}
          style={styles.addButton}
        >
          Add
        </Button>
      </View>

      {/* Todo List */}
      <View style={styles.listSection}>
        {todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No todos yet</Text>
            <Text style={styles.emptySubtext}>Add your first todo above</Text>
          </View>
        ) : (
          todos.map((todo) => (
            <View key={todo.id} style={styles.todoItem}>
              {editingId === todo.id ? (
                // Edit Mode
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingText}
                    onChangeText={setEditingText}
                    autoFocus
                    onSubmitEditing={handleSaveEdit}
                  />
                  <View style={styles.editActions}>
                    <Button
                      variant="glass"
                      systemImage="checkmark"
                      onPress={handleSaveEdit}
                      style={styles.smallButton}
                    >
                      Save
                    </Button>
                    <Button
                      variant="glass"
                      systemImage="xmark"
                      onPress={handleCancelEdit}
                      style={styles.smallButton}
                    >
                      Cancel
                    </Button>
                  </View>
                </View>
              ) : (
                // View Mode
                <>
                  <Pressable
                    style={styles.todoContent}
                    onPress={() => toggleTodo(todo.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        todo.completed === 1 && styles.checkboxChecked,
                      ]}
                    >
                      {todo.completed === 1 && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.todoTextContainer}>
                      <Text
                        style={[
                          styles.todoText,
                          todo.completed === 1 && styles.todoTextCompleted,
                        ]}
                      >
                        {todo.title}
                      </Text>
                      <Text style={styles.todoDate}>
                        {new Date(todo.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={styles.todoActions}>
                    <Button
                      variant="glass"
                      systemImage="pencil"
                      onPress={() => handleEdit(todo.id, todo.title)}
                      style={styles.iconButton}
                    />
                    <Button
                      variant="glass"
                      role="destructive"
                      systemImage="trash"
                      onPress={() => deleteTodo(todo.id)}
                      style={styles.iconButton}
                    />
                  </View>
                </>
              )}
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      {completedCount > 0 && (
        <View style={styles.actionsSection}>
          <Button
            variant="glassProminent"
            role="destructive"
            systemImage="trash.fill"
            onPress={deleteCompleted}
          >
            Clear {completedCount} Completed
          </Button>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          ✨ Todos are stored locally using SQLite
        </Text>
        <Text style={styles.infoText}>
          🔄 Updates are reactive and automatic
        </Text>
      </View>
    </ScrollView>
  );
}

function Button(
  props: React.ComponentProps<typeof ButtonPrimitive> & {
    style?: StyleProp<ViewStyle>;
  }
) {
  const { style, ...restProps } = props;
  return (
    <Host matchContents style={style}>
      <ButtonPrimitive {...restProps}>{props.children}</ButtonPrimitive>
    </Host>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  addSection: {
    gap: 12,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000",
  },
  addButton: {
    width: "100%",
  },
  listSection: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
  },
  todoItem: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    gap: 12,
  },
  todoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  todoTextContainer: {
    flex: 1,
    gap: 4,
  },
  todoText: {
    fontSize: 17,
    color: "#000",
    fontWeight: "500",
  },
  todoTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  todoDate: {
    fontSize: 13,
    color: "#999",
  },
  todoActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  iconButton: {
    minWidth: 44,
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  smallButton: {
    minWidth: 80,
  },
  actionsSection: {
    gap: 12,
  },
  infoSection: {
    gap: 8,
    paddingTop: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
