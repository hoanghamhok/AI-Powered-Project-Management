import { useState, useRef, useEffect } from "react";
import { useAI } from "../hook/useAI";

interface Message {
  role: "user" | "ai";
  content: string;
}

const ChatBox = ({ projectId }: { projectId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutate, data, error, isPending } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Append AI response to message history
  useEffect(() => {
    if (data) {
      setMessages((prev) => [...prev, { role: "ai", content: data }]);
    }
  }, [data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleAsk = () => {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    mutate({ question: trimmed, projectId });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAsk();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .chat-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .chat-root {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          font-family: 'DM Sans', sans-serif;
        }

        /* Toggle button */
        .chat-toggle {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          background: #0f0f0f;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12);
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s;
          position: relative;
          z-index: 2;
        }
        .chat-toggle:hover {
          transform: scale(1.07);
          box-shadow: 0 8px 32px rgba(0,0,0,0.28);
        }
        .chat-toggle:active {
          transform: scale(0.96);
        }
        .chat-toggle svg {
          transition: opacity 0.15s, transform 0.22s cubic-bezier(.34,1.56,.64,1);
        }
        .chat-toggle .icon-chat {
          position: absolute;
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        .chat-toggle .icon-close {
          position: absolute;
          opacity: 0;
          transform: scale(0.5) rotate(-45deg);
        }
        .chat-toggle.open .icon-chat {
          opacity: 0;
          transform: scale(0.5) rotate(45deg);
        }
        .chat-toggle.open .icon-close {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        /* Unread dot */
        .chat-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: #ff4d4d;
          border-radius: 50%;
          border: 2px solid #fff;
          animation: pulse-badge 1.6s infinite;
        }
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }

        /* Panel */
        .chat-panel {
          position: absolute;
          bottom: 68px;
          right: 0;
          width: 360px;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
          transform: scale(0.88) translateY(12px);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.2s ease;
        }
        .chat-panel.open {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        /* Header */
        .chat-header {
          background: #0f0f0f;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chat-header-avatar {
          width: 32px;
          height: 32px;
          background: #2a2a2a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chat-header-info {
          flex: 1;
        }
        .chat-header-name {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }
        .chat-header-status {
          font-size: 11px;
          color: #6b6b6b;
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 280px;
          max-height: 320px;
          background: #fafafa;
          scrollbar-width: thin;
          scrollbar-color: #e0e0e0 transparent;
        }
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 4px;
        }

        /* Empty state */
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #bbb;
          padding: 24px;
          text-align: center;
        }
        .chat-empty-icon {
          width: 40px;
          height: 40px;
          background: #f0f0f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .chat-empty p {
          font-size: 13px;
          line-height: 1.5;
        }

        /* Bubbles */
        .chat-bubble {
          display: flex;
          gap: 8px;
          animation: bubble-in 0.22s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-bubble.user {
          flex-direction: row-reverse;
        }
        .bubble-avatar {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
        }
        .bubble-avatar.ai-avatar {
          background: #0f0f0f;
          color: #fff;
        }
        .bubble-avatar.user-avatar {
          background: #e8e8e8;
          color: #555;
        }
        .bubble-text {
          max-width: 78%;
          padding: 10px 13px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.55;
          color: #1a1a1a;
        }
        .chat-bubble.ai .bubble-text {
          background: #fff;
          border: 1px solid #ebebeb;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .chat-bubble.user .bubble-text {
          background: #0f0f0f;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 12px 14px;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #ccc;
          border-radius: 50%;
          animation: typing 1.2s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* Error */
        .chat-error {
          font-size: 12px;
          color: #e53e3e;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 10px;
          padding: 8px 12px;
          text-align: center;
        }

        /* Input area */
        .chat-input-area {
          padding: 12px 14px;
          background: #fff;
          border-top: 1px solid #f0f0f0;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .chat-input {
          flex: 1;
          border: 1.5px solid #ebebeb;
          border-radius: 12px;
          padding: 9px 13px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: #1a1a1a;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s;
        }
        .chat-input::placeholder { color: #bbb; }
        .chat-input:focus {
          border-color: #0f0f0f;
          background: #fff;
        }
        .chat-send {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: none;
          background: #0f0f0f;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.15s;
        }
        .chat-send:hover:not(:disabled) {
          background: #2a2a2a;
          transform: scale(1.06);
        }
        .chat-send:active:not(:disabled) { transform: scale(0.95); }
        .chat-send:disabled {
          background: #e0e0e0;
          cursor: not-allowed;
        }

        @media (max-width: 420px) {
          .chat-panel { width: calc(100vw - 40px); right: 0; }
          .chat-root { bottom: 20px; right: 16px; }
        }
      `}</style>

      <div className="chat-root">
        {/* Chat Panel */}
        <div className={`chat-panel ${isOpen ? "open" : ""}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="#fff" opacity="0.4"/>
                <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" stroke="#fff" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
              </svg>
            </div>
            <div className="chat-header-info">
              <div className="chat-header-name">AI Assistant</div>
              <div className="chat-header-status">
                <span className="status-dot" />
                <span>Online · Project</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && !isPending ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#ccc"/>
                  </svg>
                </div>
                <p>Hỏi bất cứ điều gì về dự án của bạn.</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`}>
                    <div className={`bubble-avatar ${msg.role === "ai" ? "ai-avatar" : "user-avatar"}`}>
                      {msg.role === "ai" ? "AI" : "U"}
                    </div>
                    <div className="bubble-text">{msg.content}</div>
                  </div>
                ))}

                {isPending && (
                  <div className="chat-bubble ai">
                    <div className="bubble-avatar ai-avatar">AI</div>
                    <div className="bubble-text" style={{ padding: "4px 10px" }}>
                      <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="chat-error">⚠ Có lỗi xảy ra. Vui lòng thử lại.</p>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              disabled={isPending}
            />
            <button
              className="chat-send"
              onClick={handleAsk}
              disabled={isPending || !question.trim()}
              title="Gửi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          className={`chat-toggle ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          title={isOpen ? "Đóng chat" : "Mở chat"}
        >
          {/* Chat icon */}
          <svg className="icon-chat" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/>
          </svg>
          {/* Close icon */}
          <svg className="icon-close" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          {/* Unread badge - show when closed and has messages */}
          {!isOpen && messages.length > 0 && (
            <span className="chat-badge" />
          )}
        </button>
      </div>
    </>
  );
};

export default ChatBox;