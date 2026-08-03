"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Check, Calendar, CalendarClock, CalendarDays, CheckSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Todo } from "@/lib/types";

const QUICK_ADDS = [
  "+ Solve 2 LeetCode Medium problems",
  "+ Review 3 reattempt queue items",
  "+ Practice Codeforces 1200 rating problem",
  "+ Revise Graph Algorithms & Notes"
];

type Category = "today" | "tomorrow" | "upcoming";
type Tab = "all" | "today" | "tomorrow" | "upcoming" | "done";

export default function TodosPage() {
  const qc = useQueryClient();
  const [newTask, setNewTask] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("today");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => fetch("/api/todos").then((r) => r.json()),
  });

  const addTodo = useMutation({
    mutationFn: ({ text, category }: { text: string; category: Category }) =>
      fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    addTodo.mutate({ text: newTask.trim(), category: selectedCategory });
  };

  const handleQuickAdd = (text: string) => {
    // Remove the leading "+ " from the text if it exists
    const cleanText = text.startsWith("+ ") ? text.slice(2) : text;
    addTodo.mutate({ text: cleanText, category: "today" });
  };

  const stats = {
    todayPending: todos.filter(t => t.category === "today" && !t.completed).length,
    tomorrowPrep: todos.filter(t => t.category === "tomorrow" && !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  const filteredTodos = todos.filter(t => {
    if (activeTab === "all") return !t.completed;
    if (activeTab === "done") return t.completed;
    return t.category === activeTab && !t.completed;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6">
        
        {/* Header Stats Box */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold">Placement Prep Todo List</h1>
            </div>
            <p className="text-sm text-zinc-500">Plan your daily problem-solving targets for <span className="text-indigo-400 font-medium">Today</span> or <span className="text-amber-400 font-medium">Next Day</span>.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="bg-black/40 border border-zinc-800/80 rounded-lg px-4 py-3 flex-1 md:w-32 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">Today Pending</p>
              <p className="text-2xl font-bold font-mono-num text-indigo-400">{stats.todayPending}</p>
            </div>
            <div className="bg-black/40 border border-zinc-800/80 rounded-lg px-4 py-3 flex-1 md:w-32 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">Tomorrow Prep</p>
              <p className="text-2xl font-bold font-mono-num text-amber-400">{stats.tomorrowPrep}</p>
            </div>
            <div className="bg-black/40 border border-zinc-800/80 rounded-lg px-4 py-3 flex-1 md:w-32 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">Completed</p>
              <p className="text-2xl font-bold font-mono-num text-emerald-400">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Quick Add Section */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add something to do today or tomorrow... (e.g. Solve 2 DP problems)"
              className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 placeholder-zinc-600 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("today")}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2",
                  selectedCategory === "today" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                <Calendar className="w-4 h-4" /> Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("tomorrow")}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2",
                  selectedCategory === "tomorrow" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                <CalendarClock className="w-4 h-4" /> Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory("upcoming")}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-2",
                  selectedCategory === "upcoming" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                <CalendarDays className="w-4 h-4" /> Upcoming
              </button>
              <button
                type="submit"
                disabled={!newTask.trim() || addTodo.isPending}
                className="bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto md:ml-2"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-zinc-500 font-medium shrink-0 flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick add:
            </span>
            {QUICK_ADDS.map((qa, i) => (
              <button
                key={i}
                onClick={() => handleQuickAdd(qa)}
                className="shrink-0 bg-black/40 hover:bg-zinc-800 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {qa}
              </button>
            ))}
          </div>
        </div>

        {/* Task List Section */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto scrollbar-hide">
            <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")} count={todos.filter(t => !t.completed).length}>
              All Tasks
            </TabButton>
            <TabButton active={activeTab === "today"} onClick={() => setActiveTab("today")} icon={Calendar} count={stats.todayPending}>
              Today
            </TabButton>
            <TabButton active={activeTab === "tomorrow"} onClick={() => setActiveTab("tomorrow")} icon={CalendarClock} count={stats.tomorrowPrep}>
              Tomorrow / Next Day
            </TabButton>
            <TabButton active={activeTab === "upcoming"} onClick={() => setActiveTab("upcoming")} icon={CalendarDays} count={todos.filter(t => t.category === "upcoming" && !t.completed).length}>
              Upcoming
            </TabButton>
            <div className="flex-1" />
            <TabButton active={activeTab === "done"} onClick={() => setActiveTab("done")} count={stats.completed}>
              Done
            </TabButton>
          </div>

          <div className="p-2">
            {filteredTodos.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500 italic">No tasks found in this view.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800/40 transition-colors"
                  >
                    <button
                      onClick={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
                      className={cn(
                        "w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                        todo.completed
                          ? "bg-emerald-500 border-emerald-500 text-black"
                          : "border-zinc-600 hover:border-zinc-400 bg-black/20"
                      )}
                    >
                      {todo.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    
                    <span
                      className={cn(
                        "flex-1 text-sm transition-colors",
                        todo.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                      )}
                    >
                      {todo.text}
                    </span>

                    {!todo.completed && (
                      <CategoryBadge category={todo.category as Category} />
                    )}

                    <button
                      onClick={() => deleteTodo.mutate(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  children, 
  icon: Icon, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
  icon?: any; 
  count: number 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      <span className="text-zinc-500">({count})</span>
    </button>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  if (category === "today") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-[10px] font-medium uppercase tracking-wider">
        <Calendar className="w-3 h-3" /> Today
      </span>
    );
  }
  if (category === "tomorrow") {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-medium uppercase tracking-wider">
        <CalendarClock className="w-3 h-3" /> Tomorrow
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-500/20 bg-zinc-500/10 text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
      <CalendarDays className="w-3 h-3" /> Upcoming
    </span>
  );
}
