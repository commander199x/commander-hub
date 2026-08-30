"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "@/app/chat.css";

interface Message {
  id: number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface ProfileInfo {
  is_team: boolean;
  avatar_url: string | null;
}

const MAX_LENGTH = 300;
const COOLDOWN_MS = 3000;

export default function ChatPage() {
  const supabase = createClient();

  const [loadingUser, setLoadingUser] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [teamUsernames, setTeamUsernames] = useState<Set<string>>(new Set());
  const [profileMap, setProfileMap] = useState<Map<string, ProfileInfo>>(new Map());

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, is_admin, banned")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? null);
        setIsAdmin(profile?.is_admin ?? false);
        setIsBanned(profile?.banned ?? false);
      }

      setLoadingUser(false);
    }

    loadUser();
  }, [supabase]);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      setMessages(data ?? []);
      setLoadingMessages(false);
    }

    async function loadTeamUsernames() {
      const { data } = await supabase
        .from("profiles")
        .select("username, is_team, avatar_url");

      const teamSet = new Set<string>();
      const map = new Map<string, ProfileInfo>();

      (data ?? []).forEach((p) => {
        if (p.is_team) teamSet.add(p.username);
        map.set(p.username, { is_team: p.is_team, avatar_url: p.avatar_url });
      });

      setTeamUsernames(teamSet);
      setProfileMap(map);
    }

    loadMessages();
    loadTeamUsernames();

    const channel = supabase
      .channel("public-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = input.trim();
    if (!trimmed || !userId || !username) return;

    if (Date.now() - lastSentAt < COOLDOWN_MS) {
      setError("Slow down a little before sending another message.");
      return;
    }

    if (trimmed.length > MAX_LENGTH) {
      setError(`Message is too long (max ${MAX_LENGTH} characters).`);
      return;
    }

    setSending(true);

    const { error: sendError } = await supabase.from("messages").insert({
      user_id: userId,
      username,
      content: trimmed,
    });

    setSending(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setInput("");
    setLastSentAt(Date.now());
  }

  async function handleDelete(id: number) {
    const { error: deleteError } = await supabase.from("messages").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-window">
        <div className="chat-header">Community Chat</div>

        <div className="chat-messages" ref={scrollRef}>
          {loadingMessages && <p className="chat-status">Loading messages...</p>}

          {!loadingMessages && messages.length === 0 && (
            <p className="chat-status">No messages yet. Be the first to say something.</p>
          )}

          {messages.map((msg) => {
            const isTeam = teamUsernames.has(msg.username);
            const avatarUrl = profileMap.get(msg.username)?.avatar_url;
            return (
              <div key={msg.id} className={`chat-message${isTeam ? " chat-message-team" : ""}`}>
                <Link href={`/profile/${msg.username}`} className="chat-avatar-link">
                  <img
                    src={avatarUrl || "/default-avatar.svg"}
                    alt={msg.username}
                    className="chat-avatar"
                  />
                </Link>
                <Link href={`/profile/${msg.username}`} className={`chat-username${isTeam ? " chat-username-team" : ""}`}>
                  {msg.username}
                </Link>
                {isTeam && <span className="chat-team-badge">TEAM</span>}
                <span className="chat-content">{msg.content}</span>
                {isAdmin && (
                  <button
                    className="chat-delete-btn"
                    onClick={() => handleDelete(msg.id)}
                    aria-label="Delete message"
                    title="Delete message"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!loadingUser && !username && (
          <div className="chat-signin-prompt">
            <Link href="/login">Sign in</Link> to join the conversation.
          </div>
        )}

        {!loadingUser && username && isBanned && (
          <div className="chat-signin-prompt">
            You have been banned from chatting.
          </div>
        )}

        {!loadingUser && username && !isBanned && (
          <form onSubmit={handleSend} className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={MAX_LENGTH}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        )}

        {error && <p className="chat-error">{error}</p>}
      </div>
    </main>
  );
}
