import { useState, useRef } from "react";
import { useComments } from "../hook/useComment";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

interface Props {
  taskId: string;
}

export function CommentSection({ taskId }: Props) {
  const { comments, add, remove, loading } = useComments(taskId);
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [replyUser, setReplyUser] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);  

  const handleReply = (id: string, username: string) => {
    setParentId(id);
    setReplyUser(username);

    setTimeout(() => {
        inputRef.current?.focus();
    }, 0);
 };

  if (loading) return <p className="text-sm text-gray-400">Loading comments...</p>;

  const rootComments = comments.filter(c => !c.parentId);

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-gray-500 mb-3">
        Comments ({comments.length})
      </h2>

      <div className="space-y-4 mb-4">
        {rootComments.map(comment => (
            <CommentItem
            key={comment.id}
            comment={comment}
            replies={comments.filter(c => c.parentId === comment.id)}
            onReply={handleReply}
            onDelete={remove}
            />
        ))}
      </div>
        {replyUser && (
            <div className="text-xs text-gray-500 mb-2">
                Replying to <span className="text-blue-500">@{replyUser}</span>
            </div>
        )}
        {replyUser && (
            <button
                onClick={() => {
                setParentId(null);
                setReplyUser(null);
                }}
                className="text-xs text-red-400 ml-2"
            >
                Cancel
            </button>
        )}        
        <CommentInput
            ref={inputRef}
            onSubmit={(content) =>
                add({
                content: replyUser ? `@${replyUser} ${content}` : content,
                parentId: parentId ?? undefined,
                })
            }
        />
    </section>
  );
}