import { TrashIcon } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useConfirm } from "../../shared/components/ConfirmContext";

interface DeleteNotificationProps {
  notiId: string;
}

export function DeleteNotification({ notiId }: DeleteNotificationProps) {
  const { deleteNotification } = useNotifications();
  const { openConfirm } = useConfirm();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();

        openConfirm({
          title: "Delete notification",
          message: "Are you sure you want to delete this notification?",
          onConfirm: () => deleteNotification.mutate(notiId),
        });
      }}
      className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-700
                 text-white flex items-center justify-center"
      title="Delete notification"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}