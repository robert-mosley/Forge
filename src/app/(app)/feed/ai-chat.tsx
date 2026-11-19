"use client";

import { useState } from "react";

type StudentResult = {
  id: string;
  username: string;
  full_name: string;
  major: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  match_reason: string;
};

type ProjectResult = {
  id: string;
  title: string;
  description: string | null;
  match_reason: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  students?: StudentResult[];
  projects?: ProjectResult[];
};

export default function ForgeAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(message?: string) {
    const text = message ?? input;

    if (!text.trim() || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/forge-ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          conversation: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          students: data.students,
          projects: data.projects,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't complete that search. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="forge-ai-chat">
      <div className="forge-ai-header">
        <div>
          <span className="forge-ai-label">AI DISCOVERY</span>
          <h2>Find your next collaborator.</h2>
          <p>
            Tell Forge what you want to build, learn, or explore.
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="forge-ai-suggestions">
          {[
            "Find people interested in robotics",
            "Help me find teammates for an AI project",
            "Find students with cybersecurity experience",
            "Show me interesting projects to contribute to",
            "Generate my portfolio from GitHub: github.com/your-username",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="forge-ai-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`forge-ai-message ${message.role}`}
          >
            <p>{message.content}</p>

            {message.students?.map((student) => (
              <a
                key={student.id}
                href={`/students/${student.username}`}
                className="forge-ai-result"
              >
                <strong>{student.full_name}</strong>
                <span>{student.major}</span>
                <p>{student.match_reason}</p>
                <small>View profile ↗</small>
              </a>
            ))}

            {message.projects?.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="forge-ai-result"
              >
                <strong>{project.title}</strong>
                <p>{project.match_reason}</p>
                <small>View project ↗</small>
              </a>
            ))}
          </div>
        ))}

        {loading && (
          <div className="forge-ai-loading">
            Forge is finding relevant matches...
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="forge-ai-input"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="What are you looking for?"
          disabled={loading}
        />

        <button disabled={loading || !input.trim()}>
          {loading ? "Searching..." : "Ask Forge"}
        </button>
      </form>
    </section>
  );
}