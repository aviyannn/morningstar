"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

interface Todo {
  id?: string;
  text: string;
  completed: boolean;
  createdDate?: string | null;
  completedDate?: string | null;
  updatedDate?: string | null;
  removing?: boolean;
}

// Inline component for todo display and editing
function TodoItemInner({
  todo,
  onSave,
}: {
  todo: Todo;
  onSave: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todo.text);

  useEffect(() => {
    setValue(todo.text);
  }, [todo.text]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setValue(todo.text);
    setEditing(false);
  };

  const save = () => {
    if (!todo.id) return;
    if (value.trim() === "") return;
    onSave(todo.id, value.trim());
    setEditing(false);
  };

  return (
    <div>
      {!editing ? (
        <div className="flex items-center">
          <span className={todo.completed ? "line-through text-gray-400" : ""}>
            {todo.text}
          </span>
          <button
            onClick={startEdit}
            className="ml-2 text-xs text-blue-500 hover:underline"
            aria-label="Edit todo"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border p-1 rounded mr-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancelEdit();
            }}
          />
          <button onClick={save} className="text-sm text-green-600 mr-2">
            Save
          </button>
          <button onClick={cancelEdit} className="text-sm text-red-500">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const todosCollection = collection(db, "todos");

  // Load todos from Firestore
  useEffect(() => {
    const fetchTodos = async () => {
      // Fetch all and filter client-side so we show only active (not completed) todos.
      const snapshot = await getDocs(todosCollection);
      const all = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Todo, "id">) })) as Todo[];
      const active = all.filter((t) => t.completed !== true).sort((a, b) => (b.createdDate || "").localeCompare(a.createdDate || ""));
      setTodos(active);
    };
    fetchTodos();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    const now = new Date().toISOString();
    const newTodo: Todo = { text: input, completed: false, createdDate: now };
    const docRef = await addDoc(todosCollection, newTodo);
    setTodos([...todos, { ...newTodo, id: docRef.id }]);
    setInput("");
  };

  // allow Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  };

  // Update an existing todo text and set updatedAt in Firestore
  const updateTodoText = async (id: string, text: string) => {
    const todoRef = doc(db, "todos", id);
    const updatedAt = new Date().toISOString();
    try {
      await updateDoc(todoRef, { text, updatedAt });
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, text, updatedDate: updatedAt } : t
        )
      );
    } catch (err) {
      console.error("Failed to update todo text:", err);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    if (!todo.id) return;
    const todoRef = doc(db, "todos", todo.id);
    const updated = {
      completed: !todo.completed,
      completedDate: !todo.completed ? new Date().toISOString() : null,
    };

    try {
      // Update Firestore first
      await updateDoc(todoRef, updated);

      if (!todo.completed) {
        // item was just checked -> animate out then remove from UI
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todo.id ? { ...t, ...updated, removing: true } : t
          )
        );

        // Wait for CSS animation to complete before removing from state
        setTimeout(() => {
          setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        }, 500); // match duration in ms
      } else {
        // item was unchecked -> just update in place
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, ...updated } : t))
        );
      }
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">Todo List</h1>

      <div className="flex mb-6 w-full max-w-md">
        <input
          type="text"
          className="flex-1 p-2 border rounded-l-md focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new task"
        />
        <button
          className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600"
          onClick={handleAdd}
        >
          Add
        </button>
      </div>

      <div className="w-full max-w-md mb-6">
        <a
          href="/completed"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          View completed goals
        </a>
      </div>

      <ul className="w-full max-w-md">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex justify-between items-center p-2 mb-2 bg-white rounded shadow ${
              todo.removing ? "fade-out" : ""
            }`}
          >
            <div>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete(todo)}
                className="mr-2"
              />
              <TodoItemInner todo={todo} onSave={updateTodoText} />
            </div>
            {/* created/completed dates are stored in DB but intentionally not shown to users */}
          </li>
        ))}
      </ul>
    </div>
  );
}
