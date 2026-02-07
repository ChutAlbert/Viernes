import { useState } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");

  function send() {
    console.log("send:", message);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Chat</h1>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe..."
        />
        <button
          className="border rounded px-4 py-2"
          onClick={send}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
