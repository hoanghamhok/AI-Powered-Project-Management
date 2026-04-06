import dayjs from "dayjs";
import type { Comment } from "../type";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";

interface Props {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string, username: string) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, replies, onReply, onDelete, isReply = false }: Props) {
  dayjs.extend(relativeTime);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  function highlightMentions(text: string) {
    const parts = text.split(/(@[^\s]+(?:\s[^\s]+)*)/g);

    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">
            {part}
          </span>
        );
      }

      return part;
    });
  }

  const userInitial = comment.author.fullName
    ? comment.author.fullName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : comment.author.id.slice(0, 2).toUpperCase();

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(true);
      try {
        await onDelete(comment.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const gradients = [
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
  ];

  const gradientIndex = comment.author.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  const avatarGradient = gradients[gradientIndex];

  return (
    <div 
      className={`group flex gap-2 ${isDeleting ? 'opacity-50' : ''} transition-opacity`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full overflow-hidden ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white`}>
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={`Avatar of ${comment.author.fullName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{userInitial}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 text-xs truncate">
                {comment.author.fullName}
              </span>
              <span className="flex-shrink-0 text-xs text-gray-400">
                • {dayjs(comment.createdAt).fromNow()}
              </span>
            </div>

            {/* Action buttons - visible on hover */}
            <div className={`flex items-center gap-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={() => onReply(comment.id, comment.author.fullName)}
                className="p-1 hover:bg-blue-50 rounded-md transition-colors group/reply"
                title="Reply"
              >
                <svg className="w-3 h-3 text-gray-400 group-hover/reply:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 hover:bg-red-50 rounded-md transition-colors group/delete"
                title="Delete"
              >
                <svg className="w-3 h-3 text-gray-400 group-hover/delete:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Comment text */}
          <p className="text-xs text-gray-700 leading-relaxed break-words">
            {highlightMentions(comment.content)}
          </p>
        </div>

        <div className="flex gap-4 mt-1.5 px-2 md:hidden">
          <button
            onClick={() => onReply(comment.id, comment.author.fullName)}
            className="text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                replies={[]}
                onReply={onReply}
                onDelete={onDelete}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}