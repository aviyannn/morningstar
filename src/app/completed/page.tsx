"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Todo {
  id?: string;
  text: string;
  completed: boolean;
  createdDate?: string | null;
  completedDate?: string | null;
  updatedDate?: string | null;
}

export default function CompletedPage() {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        // Fetch all todos and filter client-side so we include items that have
        // a completedDate but may not have completed===true (legacy data)
        const todosCol = collection(db, "todos");
        const snapshot = await getDocs(todosCol);
        const all = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Todo) })) as Todo[];
        const completed = all
          .filter((t) => t.completed === true || !!t.completedDate)
          .sort((a, b) => (b.completedDate || "").localeCompare(a.completedDate || ""));
        setTodos(completed);
      } catch (err) {
        console.error("Failed to fetch completed todos:", err);
      }
    };
    void fetchCompleted();
  }, []);

  // Group by date key YYYY-MM-DD
  const groups: Record<string, Todo[]> = {};
  todos.forEach((t) => {
    const key = t.completedDate
      ? new Date(t.completedDate).toISOString().slice(0, 10)
      : "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Completed Goals</h1>
            <p className="text-sm text-gray-500 mt-1">A timeline of finished tasks grouped by day.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:shadow">
              ← Back
            </Link>
            <div className="text-sm text-gray-600">Total: <span className="font-medium text-gray-900">{todos.length}</span></div>
          </div>
        </div>

        {sortedKeys.length === 0 ? (
          <div className="rounded-lg bg-white p-6 shadow text-center text-gray-600">No completed goals yet.</div>
        ) : (
          <div className="space-y-6">
            {sortedKeys.map((key) => {
              const items = groups[key].sort((a, b) => (b.completedDate || "").localeCompare(a.completedDate || ""));
              const dateLabel = key === "unknown" ? "Unknown date" : new Date(key).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
              return (
                <section key={key} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">{dateLabel}</h2>
                    <div className="text-sm text-gray-500">{items.length} completed</div>
                  </div>

                  <ol className="space-y-2">
                    {items.map((it, idx) => (
                      <li key={it.id} className="flex items-center justify-between gap-4 p-3 rounded hover:bg-gray-50 transition">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5 bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">{idx + 1}</div>
                          <div>
                            <div className="text-gray-800">{it.text}</div>
                            {it.updatedDate && <div className="text-xs text-gray-400">Updated: {new Date(it.updatedDate).toLocaleTimeString()}</div>}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{it.completedDate ? new Date(it.completedDate).toLocaleTimeString() : "--"}</div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
