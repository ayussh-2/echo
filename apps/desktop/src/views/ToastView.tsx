import { useState, useEffect, useRef, type ReactElement } from "react";
import type { NotificationItem } from "@echo/shared-types";
import { ToastCard } from "../components";

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
        {notifications.map((notification, index) => (
          <ToastCard
            key={notification.id}
            notification={notification}
            index={index}
            progress={progress}
            replyText={replyTexts[notification.id] || ""}
            isSending={isSendingId === notification.id}
            onChangeReplyText={(text) =>
              setReplyTexts((prev) => ({
                ...prev,
                [notification.id]: text,
              }))
            }
            onSendReply={() => handleSendReply(notification)}
            onDismiss={() => handleDismissSingle(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
