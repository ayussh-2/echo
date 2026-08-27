import { useState, useEffect, type ReactElement } from "react";
import type { NotificationItem } from "@echo/shared-types";

export function ToastView(): ReactElement {
  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    window.echoApi
      ?.getInitialView()
      .then((res: { activeToast?: NotificationItem | null }) => {
        if (res && res.activeToast) {
          setNotification(res.activeToast);
        }
      });

    // Sample fallback for previewing in dev
    if (!notification) {
      setNotification({
        id: "demo-1",
        packageName: "com.whatsapp",
        appName: "WhatsApp",
        conversationId: "conv-1",
        title: "Riya Sharma",
        text: "Are we still on for 7 tonight or should I push it?",
        postedAt: Date.now() - 2 * 60 * 1000,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        hasReplyAction: true,
        isRead: false,
        isGroup: false,
        key: "key-1",
      });
    }
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      window.echoApi?.dismissToast(notification?.id ?? "");
    }
  };

  if (!notification) {
    return (
      <div className="p-4 text-xs text-ink-faint">No active notification</div>
    );
  }

  const isWhatsApp = notification.packageName.includes("whatsapp");

  return (
    <div className="w-full h-full p-2 flex items-end justify-end">
      <div className="w-full glass-card p-4 shadow-toast flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${
              isWhatsApp ? "bg-[#25D366]" : "bg-sky"
            }`}
          >
            <span className="msi text-[16px]">
              {isWhatsApp ? "chat" : "sms"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink truncate leading-tight">
              {notification.title}
            </div>
            <div className="text-[11px] font-medium text-ink-faint leading-none mt-0.5">
              {notification.appName}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-ink-faint">2m</div>
        </div>

        {/* Message */}
        <div className="text-[13px] text-ink-soft leading-relaxed px-0.5 line-clamp-2">
          &ldquo;{notification.text}&rdquo;
        </div>

        {/* Reply Bar */}
        {notification.hasReplyAction && (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply…"
              disabled={isSending}
              className="flex-1 h-9 px-3.5 bg-white/70 backdrop-blur-md rounded-full text-xs text-ink placeholder:text-ink-faint border border-black/[0.06] outline-none focus:border-primary transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!replyText.trim() || isSending}
              className="w-9 h-9 rounded-full btn-coral flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
            >
              <span className="msi text-[18px]">arrow_upward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
