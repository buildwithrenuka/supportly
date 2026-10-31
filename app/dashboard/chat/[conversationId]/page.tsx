"use client";



import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const conversationId = params.conversationId as string;
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["messages", conversationId],

    queryFn: async () => {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      return response.json();
    },
  });
  const handleSendMessage = async () => {
  if (!input.trim()) return;

  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: input,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  setInput("");
  await queryClient.invalidateQueries({
  queryKey: ["messages", conversationId],
});
};

  return (
    <div className="flex h-screen flex-col">
      {/* Chat Header */}
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">Supportly Chat</h1>
      </header>

      {/* Messages Area */}

      <main className="flex-1 overflow-y-auto p-4">
        {isLoading && <p>Loading messages...</p>}

        {error && <p className="text-red-500">Failed to load messages.</p>}

        {messages?.map((message) => (
          <div
            key={message.id}
            className={`mb-3 flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="max-w-[75%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {message.content}
            </div>
          </div>
        ))}
      </main>

      {/* Message Input */}
      <footer className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded border px-4 py-2"
          />

          <button
          onClick={handleSendMessage} 
          className="rounded bg-black px-5 py-2 text-white">
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
