import { useState } from "react";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { useColumn } from "../hooks/useColumn";

interface ColumnFormProps {
  projectId: string;
  columnId?: string;
  initialTitle?: string;
  onSuccess?: () => void;
}

export function ColumnForm({
  projectId,
  columnId,
  initialTitle = "",
  onSuccess,
}: ColumnFormProps) {
  const isEditMode = !!columnId;
  const [isShowing, setIsShowing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const { add, edit, isAddingLoading, isEditingLoading } = useColumn(projectId);
  const isLoading = isAddingLoading || isEditingLoading;

  const handleSubmit = async () => {
    if (!title.trim() || isLoading) return;
    try {
      if (isEditMode && columnId) {
        await edit(columnId, title.trim());
      } else {
        await add(title.trim());
        setTitle("");
      }
      onSuccess?.();
      if (!isEditMode) {
        setIsShowing(false);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleCancel = () => {
    setTitle(initialTitle);
    onSuccess?.();
    if (!isEditMode) {
      setIsShowing(false);
    }
  };

  if (!isEditMode && !isShowing) {
    return (
      <button
        onClick={() => setIsShowing(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        <Plus className="w-4 h-4" />
        Add Column
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0">
      <div className="space-y-2">
        {!isEditMode && (
          <p className="text-[11px] font-semibold uppercase text-gray-400">
            New Column
          </p>
        )}
        <div className="relative">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") handleCancel();
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isLoading}
              className="p-1 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}