"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { C } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type ToastKind = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
type ToastOptions = { kind?: ToastKind; duration?: number; action?: ToastAction };
type ToastItem = { id: number; message: string; kind: ToastKind; action?: ToastAction };

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, and Cancel is focused by default for safety. */
  danger?: boolean;
};

type PromptOptions = {
  title?: string;
  message?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  initialValue?: string;
};

type DialogState =
  | { type: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { type: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

export type FeedbackApi = {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, "kind">) => void;
  error: (message: string, options?: Omit<ToastOptions, "kind">) => void;
  info: (message: string, options?: Omit<ToastOptions, "kind">) => void;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

// If a component somehow renders outside the provider, fall back to the
// browser's built-in dialogs instead of crashing.
const fallbackApi: FeedbackApi = {
  toast: (message) => window.alert(message),
  success: (message) => window.alert(message),
  error: (message) => window.alert(message),
  info: (message) => window.alert(message),
  confirm: async (options) => window.confirm(typeof options === "string" ? options : options.message),
  prompt: async (options) => window.prompt(options.message ?? options.title ?? "", options.initialValue ?? ""),
};

export function useFeedback(): FeedbackApi {
  return useContext(FeedbackContext) ?? fallbackApi;
}

const KIND_COLOR: Record<ToastKind, string> = {
  success: "#22c55e",
  error: "#ef4444",
  info: "#f5a623",
};

const KEYFRAMES = `
@keyframes cz-fb-toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cz-fb-dialog-in { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes cz-fb-fade-in { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .cz-fb-anim { animation: none !important; } }
`;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const labels =
    locale === "ar"
      ? { confirm: "تأكيد", cancel: "إلغاء", close: "إغلاق", confirmTitle: "هل أنت متأكد؟", promptTitle: "أدخل التفاصيل" }
      : { confirm: "Confirm", cancel: "Cancel", close: "Dismiss", confirmTitle: "Are you sure?", promptTitle: "Enter details" };

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState("");

  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const dialogRef = useRef<DialogState | null>(null);

  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      const kind = options.kind ?? "info";
      const duration = options.duration ?? (options.action ? 8000 : 4500);
      setToasts((prev) => [...prev.slice(-3), { id, message, kind, action: options.action }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), duration)
      );
    },
    [dismissToast]
  );

  // Only one dialog at a time: opening a new one cancels the old one.
  const cancelCurrentDialog = useCallback(() => {
    const current = dialogRef.current;
    if (!current) return;
    if (current.type === "confirm") current.resolve(false);
    else current.resolve(null);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => {
        cancelCurrentDialog();
        const opts: ConfirmOptions = typeof options === "string" ? { message: options } : options;
        setDialog({ type: "confirm", options: opts, resolve });
      }),
    [cancelCurrentDialog]
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        cancelCurrentDialog();
        setPromptValue(options.initialValue ?? "");
        setDialog({ type: "prompt", options, resolve });
      }),
    [cancelCurrentDialog]
  );

  function closeDialog(result: boolean | string | null) {
    if (!dialog) return;
    if (dialog.type === "confirm") dialog.resolve(result === true);
    else dialog.resolve(typeof result === "string" ? result : null);
    setDialog(null);
  }

  // Keyboard: Esc cancels, Enter confirms (Ctrl/Cmd+Enter in multi-line prompts).
  useEffect(() => {
    if (!dialog) return;
    const current: DialogState = dialog;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(current.type === "confirm" ? false : null);
        return;
      }
      if (e.key !== "Enter") return;

      if (current.type === "confirm") {
        // Don't let Enter auto-confirm a dangerous action by accident.
        if (current.options.danger) return;
        e.preventDefault();
        closeDialog(true);
      } else {
        const multiline = !!current.options.multiline;
        if (multiline && !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        closeDialog(promptValue);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // closeDialog is recreated each render; dialog/promptValue are what matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, promptValue]);

  // Clear any pending timers if the provider ever unmounts.
  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.clear();
    };
  }, []);

  const api = useMemo<FeedbackApi>(
    () => ({
      toast,
      success: (message, options) => toast(message, { ...options, kind: "success" }),
      error: (message, options) => toast(message, { ...options, kind: "error" }),
      info: (message, options) => toast(message, { ...options, kind: "info" }),
      confirm,
      prompt,
    }),
    [toast, confirm, prompt]
  );

  const confirmDialog = dialog?.type === "confirm" ? dialog : null;
  const promptDialog = dialog?.type === "prompt" ? dialog : null;
  const danger = !!confirmDialog?.options.danger;

  const baseButton = {
    padding: "0.55rem 1.1rem",
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <style>{KEYFRAMES}</style>

      {/* Toasts */}
      <div
        aria-live="polite"
        role="status"
        style={{
          position: "fixed",
          bottom: 16,
          insetInlineEnd: 16,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "min(380px, calc(100vw - 32px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="cz-fb-anim"
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderInlineStart: `3px solid ${KIND_COLOR[t.kind]}`,
              padding: "0.7rem 0.85rem",
              color: C.paper,
              fontSize: "0.8rem",
              lineHeight: 1.4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
              animation: "cz-fb-toast-in 0.22s ease",
            }}
          >
            <span style={{ flex: 1 }}>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismissToast(t.id);
                }}
                style={{
                  background: "none",
                  border: `1px solid ${KIND_COLOR[t.kind]}`,
                  color: KIND_COLOR[t.kind],
                  padding: "0.2rem 0.6rem",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label={labels.close}
              title={labels.close}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      {dialog && (
        <div
          className="cz-fb-anim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog(dialog.type === "confirm" ? false : null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "cz-fb-fade-in 0.15s ease",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              confirmDialog
                ? confirmDialog.options.title ?? labels.confirmTitle
                : promptDialog?.options.title ?? labels.promptTitle
            }
            className="cz-fb-anim"
            style={{
              width: "min(440px, 100%)",
              background: C.panel,
              border: `1px solid ${danger ? "#ef4444" : C.amber}`,
              padding: "1.4rem",
              color: C.paper,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              animation: "cz-fb-dialog-in 0.18s ease",
            }}
          >
            <h2
              className="cz-display uppercase"
              style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.6rem", color: danger ? "#ef4444" : C.paper }}
            >
              {confirmDialog
                ? confirmDialog.options.title ?? labels.confirmTitle
                : promptDialog?.options.title ?? labels.promptTitle}
            </h2>

            {(confirmDialog?.options.message || promptDialog?.options.message) && (
              <p style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: "1rem" }}>
                {confirmDialog ? confirmDialog.options.message : promptDialog?.options.message}
              </p>
            )}

            {promptDialog &&
              (promptDialog.options.multiline ? (
                <textarea
                  autoFocus
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptDialog.options.placeholder}
                  rows={4}
                  style={{
                    width: "100%",
                    background: "#131313",
                    border: `1px solid ${C.line}`,
                    color: "#eee",
                    padding: "0.55rem 0.7rem",
                    fontFamily: "inherit",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    resize: "vertical",
                  }}
                />
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptDialog.options.placeholder}
                  style={{
                    width: "100%",
                    background: "#131313",
                    border: `1px solid ${C.line}`,
                    color: "#eee",
                    padding: "0.55rem 0.7rem",
                    fontFamily: "inherit",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                />
              ))}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                autoFocus={danger}
                onClick={() => closeDialog(confirmDialog ? false : null)}
                style={{ ...baseButton, background: "none", border: `1px solid ${C.line}`, color: C.paper }}
              >
                {(confirmDialog ? confirmDialog.options.cancelLabel : promptDialog?.options.cancelLabel) ?? labels.cancel}
              </button>
              <button
                type="button"
                autoFocus={!!confirmDialog && !danger}
                onClick={() => closeDialog(confirmDialog ? true : promptValue)}
                style={{
                  ...baseButton,
                  background: danger ? "#ef4444" : C.amber,
                  border: `1px solid ${danger ? "#ef4444" : C.amber}`,
                  color: danger ? "#fff" : C.void,
                }}
              >
                {(confirmDialog ? confirmDialog.options.confirmLabel : promptDialog?.options.confirmLabel) ?? labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
