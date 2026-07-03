export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-fade-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[70%] ${
          isUser ? "text-white" : "border border-[var(--border)]"
        }`}
        style={{
          background: isUser ? "var(--primary)" : "var(--card)",
        }}
      >
        {message.content}
        {message.streaming && (
          <span className="streaming-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-current align-middle" />
        )}
      </div>
    </div>
  );
}
