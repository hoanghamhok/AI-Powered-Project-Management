    import { useEffect, useState } from "react";
    import { useTask } from "../hooks/useTasks";
    import { useProjectMembers } from "../../members/hooks/useProjectMembers";

    interface TaskFormProps {
        projectId: string;
        taskId?: string;
        columnId: string;
        onClose: () => void;
    }

    export function TaskForm({ projectId, taskId, columnId, onClose }: TaskFormProps) {
    const { tasks, add, edit } = useTask(projectId);
    const { data: members = [] } = useProjectMembers(projectId);
    const isEditting = Boolean(taskId);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigneeIds: [] as string[],
        dueDate: "",
        estimateHours: "" as number | "",
        difficulty: "" as number | ""
    });

    // Load data vào form khi Edit
    useEffect(() => {
        if (!isEditting || !taskId) return;
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;

        setFormData({
        title: currentTask.title || "",
        description: currentTask.description || "",
        assigneeIds: currentTask.assigneeIds || [],
        dueDate: currentTask.dueDate?.split("T")[0] || "",
        estimateHours: currentTask.estimateHours ?? "",
        difficulty: currentTask.difficulty ?? ""
        });
    }, [taskId, tasks, isEditting]);

    const getInitials = (name: string) => name ? name[0].toUpperCase() : "?";
    const getAvatarColor = (id: string) => {
        const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"];
        const index = id.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const numberFields = ["estimateHours", "difficulty"];
    
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: numberFields.includes(name)
            ? value === "" ? "" : Number(value)
            : value
        }));
    };

    // if đã chọn remove else add(user đã được chọn=> bỏ chọn,user chưa chọn=>thêm vào)
    const toggleAssignee = (userId: string) => {
        setFormData(prev => ({
        ...prev,
        assigneeIds: prev.assigneeIds.includes(userId)
            ? prev.assigneeIds.filter(id => id !== userId)
            : [...prev.assigneeIds, userId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
        ...formData,
        difficulty: formData.difficulty === "" ? undefined : formData.difficulty,
        estimateHours: formData.estimateHours === "" ? undefined : formData.estimateHours
        };

        try {
        if (isEditting && taskId) {
            await edit(taskId, payload);
        } else {
            await add(
            columnId,
            formData.title,
            projectId,
            formData.description,
            formData.assigneeIds,
            formData.dueDate,
            Number(formData.estimateHours) || 0,
            Number(formData.difficulty) || 0
            );
        }
        onClose();
        } catch (err) {
        console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl w-[450px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
            {isEditting ? " Edit Task" : " New Task"}
        </h2>

        <div className="space-y-4">
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
            <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                className="w-full border-b focus:border-violet-500 outline-none py-2 transition"
                required
            />
            </div>

            <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">
                Assignees {formData.assigneeIds.length > 0 && `(${formData.assigneeIds.length})`}
            </p>
            <div className="flex flex-wrap gap-2">
                {members.map((m: any) => {
                const selected = formData.assigneeIds.includes(m.userId);
                const avatar = m.user?.avatarUrl;
                const username = m.user?.username || "User";
                return (
                    <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleAssignee(m.userId)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                        ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300"
                    }`}
                    >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border border-white/20 ${getAvatarColor(m.userId)}`}>
                        {avatar ? (
                        <img src={avatar} alt={username} className="w-full h-full object-cover" />
                        ) : getInitials(username)}
                    </span>
                    {username}
                    </button>
                );
                })}
            </div>
            </div>

            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
            <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add some details..."
                className="w-full border rounded-lg p-2 mt-1 text-sm min-h-[80px] focus:ring-1 focus:ring-violet-500 outline-none"
            />
            </div>

            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Due Date</label>
                <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-sm outline-none"
                />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Estimate (h)</label>
                <input
                type="number"
                name="estimateHours"
                value={formData.estimateHours}
                onChange={handleChange}
                placeholder="0"
                className="w-full border rounded-lg p-2 mt-1 text-sm outline-none"
                />
            </div>
            </div>

            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Difficulty</label>
            <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 mt-1 text-sm outline-none bg-white"
            >
                <option value="">Select Difficulty</option>
                <option value="1"> Easy</option>
                <option value="2"> Medium</option>
                <option value="3"> Hard</option>
            </select>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                className="px-5 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-lg shadow-violet-200 transition"
            >
                {isEditting ? "Save Changes" : "Create Task"}
            </button>
            </div>
        </div>
        </form>
    );
    }