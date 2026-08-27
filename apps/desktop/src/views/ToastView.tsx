import { useState, useEffect, useRef, type ReactElement } from "react";
import type { NotificationItem } from "@echo/shared-types";

export function ToastView(): ReactElement {
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPausedTimer, setIsPausedTimer] = useState(false);
  const [progress, setProgress] = useState(100);

  const durationMs = 8000;
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    window.echoApi
      ?.getInitialView()
      .then((res: { activeToast?: NotificationItem | null }) => {
        if (res?.activeToast) {
          setNotification(res.activeToast);
          setProgress(100);
          startTimeRef.current = Date.now();
        }
      });

    const unsubscribe = window.echoApi?.onNotificationReceived((notif) => {
      setNotification(notif);
      setProgress(100);
      startTimeRef.current = Date.now();
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Auto-dismiss countdown timer
  useEffect(() => {
    if (!notification || isSending || isPausedTimer || replyText.length > 0) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        window.echoApi?.dismissToast(notification.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification, isSending, isPausedTimer, replyText, durationMs]);

  const handleSend = async () => {
    if (!replyText.trim() || !notification || isSending) return;

    setIsSending(true);
    try {
      await window.echoApi?.sendReply({
        notificationId: notification.id,
        packageName: notification.packageName,
        conversationId: notification.conversationId,
        text: replyText.trim(),
      });
      await window.echoApi?.dismissToast(notification.id);
    } catch {
      setIsSending(false);
    }
  };

  const handleDismiss = () => {
    if (notification) {
      window.echoApi?.dismissToast(notification.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      handleDismiss();
    }
  };

  if (!notification) {
    return (
      <div className="p-4 text-xs text-ink-faint">No active notification</div>
    );
  }

  const isWhatsApp = notification.packageName.includes("whatsapp");

  return (
    <div
      className="w-full h-full p-2 flex items-end justify-end select-none bg-transparent"
      onMouseEnter={() => setIsPausedTimer(true)}
      onMouseLeave={() => {
        setIsPausedTimer(false);
        startTimeRef.current =
          Date.now() - ((100 - progress) / 100) * durationMs;
      }}
    >
      <div className="w-full glass-card p-4 shadow-toast flex flex-col gap-2.5 rounded-2xl border border-white/95 animate-in fade-in slide-in-from-bottom-3 duration-200 relative overflow-hidden">
        {/* Auto-dismiss subtle progress line */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-primary/40 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shadow-sm ${
              isWhatsApp
                ? "bg-gradient-to-br from-[#4ade80] to-[#22c55e]"
                : "bg-gradient-to-br from-sky to-[#0ea5e9]"
            }`}
          >
            <span className="text-xs">{isWhatsApp ? "💬" : "✉️"}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink truncate leading-tight">
              {notification.title}
            </div>
            <div className="text-[11px] font-medium text-ink-faint leading-none mt-0.5">
              {notification.appName}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            title="Dismiss (Esc)"
            className="w-5 h-5 rounded-full hover:bg-black/5 flex items-center justify-center text-ink-faint hover:text-ink text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Message preview */}
        <div className="text-[13px] text-ink-soft leading-relaxed px-0.5 line-clamp-2">
          &ldquo;{notification.text}&rdquo;
        </div>

        {/* Reply Bar */}
        {notification.hasReplyAction && (
          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type reply and press Enter…"
              disabled={isSending}
              className="flex-1 h-8 px-3.5 bg-white/80 backdrop-blur-md rounded-full text-xs text-ink placeholder:text-ink-faint border border-black/[0.08] outline-none focus:border-primary transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!replyText.trim() || isSending}
              className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold hover:bg-black/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isSending ? "..." : "↑"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
