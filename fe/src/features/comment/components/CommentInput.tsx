import { useState, forwardRef } from "react";

interface Props {
  onSubmit: (content: string) => Promise<any>;
}

export const CommentInput = forwardRef<HTMLInputElement, Props>(
  ({ onSubmit }, ref) => {
    const [text, setText] = useState("");

    const handleSend = async () => {
      if (!text.trim()) return;

      await onSubmit(text);
      setText("");
    };

    return (
      <div className="flex gap-2">
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />

        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    );
  }
);