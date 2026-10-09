import { useEffect, useRef, useState } from "react";

export default function Chat({ messages, onSend, disabled }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="panel flex h-56 flex-col overflow-hidden">
      <div className="border-b border-white/10 px-3 py-2 text-sm font-medium">Chat</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && <p className="text-white/40">Say hello</p>}
        {messages.map((m, i) => (
          <div key={`${m.at}-${i}`}>
            <span className="text-oak-300">{m.username}: </span>
            <span>{m.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-2">
        <input
          className="input py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          disabled={disabled}
          maxLength={300}
        />
        <button type="submit" className="btn-primary px-3 py-2 text-sm" disabled={disabled}>
          Send
        </button>
      </form>
    </div>
  );
}
