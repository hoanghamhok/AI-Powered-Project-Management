import { useState, useRef, useEffect } from "react";
import { useComments } from "../hook/useComment";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

interface Props {
  taskId: string;
}

export function CommentSection({ taskId }: Props) {
  const { comments, add, remove, loading } = useComments(taskId);
  const [parentId, setParentId] = useState<string | null>(null);
  const [replyUser, setReplyUser] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(2);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleReply = (id: string, username: string) => {
    setParentId(id);
    setReplyUser(username);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleCancelReply = () => {
    setParentId(null);
    setReplyUser(null);
  };

  const handleSubmit = async (content: string) => {
    const finalContent = replyUser ? `@${replyUser} ${content}` : content;
    await add({
      content: finalContent,
      parentId: parentId ?? undefined,
    });
    handleCancelReply();
  };

  if (loading) {
    return (
      <section className="mt-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const rootComments = comments.filter((c) => !c.parentId);
  
  // Sort by newest first and limit visible comments
  const sortedRootComments = [...rootComments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const visibleComments = sortedRootComments.slice(0, visibleCount);
  const hasMore = sortedRootComments.length > visibleCount;
  const remainingCount = sortedRootComments.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  const handleShowLess = () => {
    setVisibleCount(2);
  };

  return (
    <section className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comments
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {comments.length} 
            </span>
          </h2>
        </div>
      </div>

      {/* Comments List */}
      {rootComments.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {visibleComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={comments.filter((c) => c.parentId === comment.id)}
                onReply={handleReply}
                onDelete={remove}
              />
            ))}
          </div>

          {/* Load More / Show Less Buttons */}
          {(hasMore || visibleCount > 2) && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  className="group flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Load {remainingCount} more {remainingCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
              
              {visibleCount > 3 && (
                <button
                  onClick={handleShowLess}
                  className="group flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">No comments yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts</p>
        </div>
      )}

      {/* Input Section */}
      <div className="border-t pt-4">
        <CommentInput
          ref={inputRef}
          onSubmit={handleSubmit}
          replyUser={replyUser}
          onCancelReply={handleCancelReply}
        />
      </div>
    </section>
  );
}