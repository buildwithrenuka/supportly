"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  conversation: {
    messages: {
      id: string;
      content: string;
      role: string;
      createdAt: string;
    }[];
  };
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchTickets() {
    try {
      const response = await fetch("/api/admin/tickets");

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      setError("Unable to load tickets.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  async function updateStatus(
    ticketId: string,
    status: Ticket["status"]
  ) {
    try {
      const response = await fetch(
        `/api/admin/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket");
      }

      const updatedTicket = await response.json();

      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: updatedTicket.status }
            : ticket
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to update ticket status.");
    }
  }

  if (loading) {
    return <p>Loading tickets...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (tickets.length === 0) {
    return <p>No support tickets found.</p>;
  }

  return (
    <div className="space-y-6">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="rounded-xl border p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {ticket.subject}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {ticket.user.name} · {ticket.user.email}
              </p>
            </div>

            <select
              value={ticket.status}
              onChange={(event) =>
                updateStatus(
                  ticket.id,
                  event.target.value as Ticket["status"]
                )
              }
              className="rounded-md border p-2"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <p className="my-4 text-sm">
            {ticket.description}
          </p>

          <details className="mt-4">
            <summary className="cursor-pointer font-medium">
              View Conversation History (
              {ticket.conversation.messages.length} messages)
            </summary>

            <div className="mt-3 space-y-3">
              {ticket.conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
                >
                  <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                    {message.role}
                  </p>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          </details>

          <p className="mt-4 text-xs text-gray-400">
            Created: {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}