"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, GripVertical, Calendar, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/types";

export default function TodosPage() {
  const qc = useQueryClient();
  const [newTask, setNewTask] = useState("");
  const [isAddingToday, setIsAddingToday] = useState(true);

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => fetch("/api/todos").then((r) => r.json()),
  });

  const addTodo = useMutation({
    mutationFn: (text: string) =>
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, isToday: isAddingToday }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      setNewTask("");
    },
  });

  const toggleTodo = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      }).then((r) => r.json()),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const prev = qc.getQueryData<Todo[]>(["todos"]);
      if (prev) {
        qc.setQueryData<Todo[]>(
          ["todos"],
          prev.map((t) => (t.id === id ? { ...t, completed } : t))
        );
      }
      return { prev };
    },
    onError: (err, variables, context) => {
      if (context?.prev) qc.setQueryData(["todos"], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => fetch(`/api/todos?id=${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const clearAll = useMutation({
    mutationFn: () => fetch(`/api/todos?all=true`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo.mutate(newTask.trim());
  };

  const todayTodos = todos.filter((t) => t.isToday);
  const tomorrowTodos = todos.filter((t) => !t.isToday);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-[800px] mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Action Plan</h1>
            <p className="text-xs text-zinc-500 mt-1">Organize your daily DSA tasks.</p>
          </div>
          <button
            onClick={() => {
              if (confirm("Delete all tasks?")) clearAll.mutate();
            }}
            disabled={todos.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddingToday(true)}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-md border transition-colors flex items-center gap-2",
                isAddingToday ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Calendar className="w-3.5 h-3.5" /> Today
            </button>
            <button
              type="button"
              onClick={() => setIsAddingToday(false)}
              className={cn(
                "px-3 py-2 text-xs font-medium rounded-md border transition-colors flex items-center gap-2",
                !isAddingToday ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <CalendarClock className="w-3.5 h-3.5" /> Tomorrow
            </button>
            <button
              type="submit"
              disabled={!newTask.trim() || addTodo.isPending}
              className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TodoSection
            title="Today"
            todos={todayTodos}
            onToggle={(id, c) => toggleTodo.mutate({ id, completed: c })}
            onDelete={(id) => deleteTodo.mutate(id)}
          />
          <TodoSection
            title="Tomorrow"
            todos={tomorrowTodos}
            onToggle={(id, c) => toggleTodo.mutate({ id, completed: c })}
            onDelete={(id) => deleteTodo.mutate(id)}
          />
        </div>
      </div>
    </div>
  );
}

function TodoSection({
  title,
  todos,
  onToggle,
  onDelete,
}: {
  title: string;
  todos: Todo[];
  onToggle: (id: string, c: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{todos.length}</span>
      </div>
      <div className="p-2 flex-1">
        {todos.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-zinc-600 italic">
            No tasks for {title.toLowerCase()}.
          </div>
        ) : (
          <ul className="space-y-1">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800/50 transition-colors"
              >
                <button
                  onClick={() => onToggle(todo.id, !todo.completed)}
                  className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                    todo.completed
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-zinc-600 hover:border-zinc-400"
                  )}
                >
                  {todo.completed && <Check className="w-3 h-3" />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm transition-colors",
                    todo.completed ? "text-zinc-600 line-through" : "text-zinc-300"
                  )}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
