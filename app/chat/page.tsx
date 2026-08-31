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
  is_admin: boolean;
  is_owner: boolean;
  avatar_url: string | null;
}

const MAX_LENGTH = 300;
const COOLDOWN_MS = 3000;
const GROUP_WINDOW_MS = 5 * 60 * 1000; // messages within 5 min from the same person group together

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

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
        .select("username, is_team, is_admin, is_owner, avatar_url");

      const teamSet = new Set<string>();
      const map = new Map<string, ProfileInfo>();

      (data ?? []).forEach((p) => {
        if (p.is_team) teamSet.add(p.username);
        map.set(p.username, { is_team: p.is_team, is_admin: p.is_admin, is_owner: p.is_owner, avatar_url: p.avatar_url });
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
        <div className="chat-header">
          <span className="chat-header-title">Community Chat</span>
          <span className="chat-header-live">
            <span className="chat-live-dot" />
            Live
          </span>
        </div>

        <div className="chat-messages" ref={scrollRef}>
          {loadingMessages && <p className="chat-status">Loading messages...</p>}

          {!loadingMessages && messages.length === 0 && (
            <p className="chat-status">No messages yet. Be the first to say something.</p>
          )}

          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const isGrouped =
              prev &&
              prev.username === msg.username &&
              new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;

            const isTeam = teamUsernames.has(msg.username);
            const isAdminUser = profileMap.get(msg.username)?.is_admin ?? false;
            const isOwnerUser = profileMap.get(msg.username)?.is_owner ?? false;
            const avatarUrl = profileMap.get(msg.username)?.avatar_url;
            const highlighted = isTeam || isAdminUser || isOwnerUser;

            let roleBadge: { label: string; className: string } | null = null;
            if (isOwnerUser) roleBadge = { label: "OWNER", className: "chat-owner-badge" };
            else if (isAdminUser) roleBadge = { label: "ADMIN", className: "chat-admin-badge" };
            else if (isTeam) roleBadge = { label: "TEAM", className: "chat-team-badge" };

            return (
              <div
                key={msg.id}
                className={`chat-message${highlighted ? " chat-message-highlighted" : ""}${isGrouped ? " chat-message-grouped" : ""}`}
              >
                <div className="chat-avatar-slot">
                  {!isGrouped && (
                    <Link href={`/profile/${msg.username}`} className="chat-avatar-link">
                      <img
                        src={avatarUrl || "/default-avatar.svg"}
                        alt={msg.username}
                        className="chat-avatar"
                      />
                    </Link>
                  )}
                </div>

                <div className="chat-message-body">
                  {!isGrouped && (
                    <div className="chat-message-meta">
                      <Link href={`/profile/${msg.username}`} className={`chat-username${highlighted ? " chat-username-highlighted" : ""}`}>
                        {msg.username}
                      </Link>
                      {roleBadge && <span className={roleBadge.className}>{roleBadge.label}</span>}
                      <span className="chat-timestamp">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className="chat-content-row">
                    <span className="chat-content">{msg.content}</span>
                    {isGrouped && (
                      <span className="chat-timestamp chat-timestamp-hover">{formatTime(msg.created_at)}</span>
                    )}
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
                </div>
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
              placeholder="Message the community..."
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
