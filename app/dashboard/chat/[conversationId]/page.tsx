"use client";



import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
type Message = {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  conversationId: string;
  createdAt: string;
};

export default function ChatPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);  
  const conversationId = params.conversationId as string;
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery<Message[]>({
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
  if (!input.trim() || isStreaming) return;

  const userMessage = input.trim();

  try {
    setIsStreaming(true);
    setStreamingResponse("");

    // Step 1: Save user message
    const messageResponse = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: userMessage,
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error("Failed to save user message");
    }

    setInput("");

    // Step 2: Call AI streaming API
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to get AI response");
    }

    // Step 3: Read AI response chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, {
        stream: true,
      });

      setStreamingResponse((previous) => previous + chunk);
    }

    // Step 4: Read any remaining decoded text
    const remaining = decoder.decode();

    if (remaining) {
      setStreamingResponse((previous) => previous + remaining);
    }

  } catch (error) {
    console.error("Chat Error:", error);
    alert("Something went wrong. Please try again.");

  } finally {
    // Step 5: Fetch updated messages from database
    await queryClient.invalidateQueries({
      queryKey: ["messages", conversationId],
    });

    setStreamingResponse("");
    setIsStreaming(false);
  }
};
  return (
    <div className="flex h-screen flex-col">
      {/* Chat Header */}
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">Supportly Chat</h1>
      </header>

      {/* Messages Area */}

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
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
        {isStreaming && (
  <div className="mb-3 flex justify-start">
    <div className="max-w-[75%] rounded-lg bg-gray-100 px-4 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      {streamingResponse || "Thinking..."}
    </div>
  </div>
)}
      </main>

      {/* Message Input */}
      <footer className="shrink-0 border-t bg-white p-4 dark:bg-gray-950">
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
          className="rounded bg-black px-5 py-2 text-white"
          disabled={isStreaming || !input.trim()}>
           {isStreaming ? "Thinking..." : "Send"}
          </button>
        </div>
      </footer>
    </div>
  );
}
