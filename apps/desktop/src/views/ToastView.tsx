import { useState, useEffect, useRef, type ReactElement } from "react";
import { MessageSquare, Mail, X, ArrowUp } from "lucide-react";
import type { NotificationItem } from "@echo/shared-types";

export function ToastView(): ReactElement {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  const durationMs = 9000;
  const startTimeRef = useRef<number>(Date.now());

  // Listen for initial view and real-time toast stack updates
  useEffect(() => {
    window.echoApi?.getInitialView().then((res) => {
      if (res?.activeToasts && res.activeToasts.length > 0) {
        setNotifications(res.activeToasts);
        setProgress(100);
        startTimeRef.current = Date.now();
      } else if (res?.activeToast) {
        setNotifications([res.activeToast]);
        setProgress(100);
        startTimeRef.current = Date.now();
      }
    });

    const unsubStack = window.echoApi?.onToastStackUpdated?.((stack) => {
      if (stack && stack.length > 0) {
        setNotifications(stack);
        setProgress(100);
        startTimeRef.current = Date.now();
      } else {
        setNotifications([]);
      }
    });

    const unsubSingle = window.echoApi?.onNotificationReceived?.((notif) => {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== notif.id);
        return [notif, ...filtered].slice(0, 4);
      });
      setProgress(100);
      startTimeRef.current = Date.now();
    });

    return () => {
      unsubStack?.();
      unsubSingle?.();
    };
  }, []);

  const hasAnyActiveTyping = Object.values(replyTexts).some((txt) => txt.length > 0);

  // Auto-dismiss countdown timer (pauses on hover or active typing)
  useEffect(() => {
    if (notifications.length === 0 || isSendingId !== null || isHovered || hasAnyActiveTyping) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        window.echoApi?.dismissToast();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notifications.length, isSendingId, isHovered, hasAnyActiveTyping, durationMs]);

  const handleSendReply = async (notif: NotificationItem) => {
    const text = replyTexts[notif.id]?.trim();
    if (!text || isSendingId) return;

    setIsSendingId(notif.id);
    try {
      await window.echoApi?.sendReply({
        notificationId: notif.id,
        packageName: notif.packageName,
        conversationId: notif.conversationId,
        text,
      });
      setReplyTexts((prev) => {
        const next = { ...prev };
        delete next[notif.id];
        return next;
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    } finally {
      setIsSendingId(null);
    }
  };

  const handleDismissSingle = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    window.echoApi?.dismissToast(id);
  };

  const handleDismissAll = () => {
    setNotifications([]);
    window.echoApi?.dismissToast();
  };

  if (notifications.length === 0) {
    return <div className="w-full h-full bg-transparent" />;
  }

  return (
    <div
      className="w-full h-full p-2 flex flex-col justify-end gap-2 select-none bg-transparent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        startTimeRef.current = Date.now() - ((100 - progress) / 100) * durationMs;
      }}
    >
      {/* Header dismiss all if multiple notifications exist in stack */}
      {notifications.length > 1 && (
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-ink text-white rounded-xl shadow-lg border border-black/10 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold tracking-wide">
              {notifications.length} Unread Notifications
            </span>
          </div>
          <button
            onClick={handleDismissAll}
            className="px-2 py-0.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 rounded-md transition-all"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Stacked Cards */}
      <div className="flex flex-col gap-2">
        {notifications.map((notification, index) => {
          const isWhatsApp = notification.packageName.includes("whatsapp");
          const isLatest = index === 0;
          const currentText = replyTexts[notification.id] || "";

          return (
            <div
              key={notification.id}
              className={`w-full glass-card p-3.5 shadow-toast flex flex-col gap-2.5 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 relative overflow-hidden ${
                isLatest ? "border-primary/40 shadow-md" : "border-black/[0.08]"
              }`}
            >
              {/* Auto-dismiss subtle progress line on the latest toast */}
              {isLatest && (
                <div
                  className="absolute top-0 left-0 h-[2.5px] bg-primary/40 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}

              {/* Header */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shadow-sm shrink-0 ${
                    isWhatsApp
                      ? "bg-gradient-to-br from-[#4ade80] to-[#22c55e]"
                      : "bg-gradient-to-br from-sky to-[#0ea5e9]"
                  }`}
                >
                  {isWhatsApp ? (
                    <MessageSquare size={13} strokeWidth={2.5} />
                  ) : (
                    <Mail size={13} strokeWidth={2.5} />
                  )}
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
                  onClick={() => handleDismissSingle(notification.id)}
                  title="Dismiss"
                  className="w-5 h-5 rounded-full hover:bg-black/5 flex items-center justify-center text-ink-faint hover:text-ink text-xs transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Message preview */}
              <div className="text-[13px] text-ink-soft leading-relaxed px-0.5 line-clamp-2">
                &ldquo;{notification.text}&rdquo;
              </div>

              {/* Quick Reply Bar */}
              {notification.hasReplyAction && (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    autoFocus={isLatest}
                    value={currentText}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({
                        ...prev,
                        [notification.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendReply(notification);
                      } else if (e.key === "Escape") {
                        handleDismissSingle(notification.id);
                      }
                    }}
                    placeholder={`Reply to ${notification.title}...`}
                    disabled={isSendingId === notification.id}
                    className="flex-1 h-8 px-3.5 bg-white/80 backdrop-blur-md rounded-full text-xs text-ink placeholder:text-ink-faint border border-black/[0.08] outline-none focus:border-primary transition-all"
                  />
                  <button
                    onClick={() => handleSendReply(notification)}
                    disabled={!currentText.trim() || isSendingId === notification.id}
                    className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold hover:bg-black/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                  >
                    {isSendingId === notification.id ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowUp size={13} strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
