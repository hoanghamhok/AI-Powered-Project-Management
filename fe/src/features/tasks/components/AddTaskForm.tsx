import { useState } from "react";
import { Calendar, Clock, Zap, ChevronDown } from "lucide-react";

type AddTaskInput = {
  title: string;
  description: string;
  assigneeIds: string[];
  dueDate?: string;
  estimateHours?: number;
  difficulty?: number;
};

type Props = {
  onSubmit: (data: AddTaskInput) => Promise<void>;
  assignees: any[];
};

export function AddTaskForm({ onSubmit, assignees }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [estimateHours, setEstimateHours] = useState<number | "">("");
  const [difficulty, setDifficulty] = useState<number>(3);

  const canAdd = !!title.trim() && assigneeIds.length > 0;

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const avatarColors = [
    "bg-violet-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-fuchsia-500",
    "bg-cyan-500",
    "bg-orange-500",
  ];

  const getAvatarColor = (id: string) => {
    const index = id.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  const difficultyConfig = [
    { value: 1, label: "Easy", color: "text-emerald-600", bg: "bg-emerald-50" },
    { value: 2, label: "Normal", color: "text-sky-600", bg: "bg-sky-50" },
    { value: 3, label: "Medium", color: "text-amber-600", bg: "bg-amber-50" },
    { value: 4, label: "Hard", color: "text-rose-600", bg: "bg-rose-50" },
  ];

  const handleSubmit = async () => {
    if (!canAdd) return;

    await onSubmit({
      title: title.trim(),
      description,
      assigneeIds,
      dueDate: dueDate || undefined,
      estimateHours: estimateHours === "" ? undefined : Number(estimateHours),
      difficulty,
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setAssigneeIds([]);
    setEstimateHours("");
    setDifficulty(3);
    setIsExpanded(false);
  };

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400";

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 text-left text-sm text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-violet-300 rounded-xl transition-all group flex items-center gap-2"
      >
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Add new task</span>
      </button>
    );
  }

  return (
    <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500" />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            ✨ New Task
          </p>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title…"
          className={inputCls}
        />

        {/* Description */}
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)…"
          className={`${inputCls} resize-none`}
        />

        {/* Due Date */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            <Calendar className="w-3 h-3" />
            Due Date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Estimate Hours */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimateHours}
              onChange={(e) =>
                setEstimateHours(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              <Zap className="w-3 h-3" />
              Difficulty
            </label>
            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className={`${inputCls} appearance-none pr-8`}
              >
                {difficultyConfig.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Assignees {assigneeIds.length > 0 && `(${assigneeIds.length})`}
            </p>
            <div className="flex flex-wrap gap-2">
              {assignees.map((m: any) => {
                const selected = assigneeIds.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() =>
                      setAssigneeIds((prev) =>
                        prev.includes(m.userId)
                          ? prev.filter((id) => id !== m.userId)
                          : [...prev, m.userId]
                      )
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${getAvatarColor(m.userId)}`}
                    >
                      {getInitials(m.user?.username ?? "")}
                    </span>
                    {m.user?.username}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            disabled={!canAdd}
            onClick={handleSubmit}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition shadow-sm ${
              canAdd
                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Add Task
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}