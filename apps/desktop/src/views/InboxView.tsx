import { useState, useEffect, type ReactElement } from "react";
import { QrCode, Settings, Inbox } from "lucide-react";
import type { NotificationItem } from "@echo/shared-types";
import { WindowsTitleBar, NotificationCard } from "../components";
import type { UserSession } from "../types/electron";

export function InboxView(): ReactElement {
  const [session, setSession] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    window.echoApi?.getStoredSession().then((s) => setSession(s));
    window.echoApi?.getNotifications().then((list) => {
      if (list && list.length > 0) setNotifications(list);
    });
    window.echoApi?.getAutoStart().then((enabled) => setAutoStart(enabled));

    const unsubNotifs = window.echoApi?.onNotificationsUpdated((list) => {
      if (list) setNotifications(list as NotificationItem[]);
    });

    const unsubSession = window.echoApi?.onSessionChanged((s) => {
      setSession(s);
    });

    return () => {
      unsubNotifs?.();
      unsubSession?.();
    };
  }, []);

  const handleToggleAutoStart = async () => {
    const next = !autoStart;
    setAutoStart(next);
    await window.echoApi?.setAutoStart(next);
  };

  const handleSignOut = async () => {
    await window.echoApi?.signOut();
    window.location.hash = "pair";
  };

  const handleOpenPair = () => {
    window.location.hash = "pair";
  };

  const handleMarkAllRead = async () => {
    await window.echoApi?.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearRead = async () => {
    await window.echoApi?.clearReadNotifications();
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  };

  const handleSendReply = async (notif: NotificationItem) => {
    if (!replyText.trim() || isSending) return;
    setIsSending(true);
    try {
      await window.echoApi?.sendReply({
        notificationId: notif.id,
        packageName: notif.packageName,
        conversationId: notif.conversationId,
        text: replyText.trim(),
      });
      setReplyText("");
      setExpandedId(null);
      await window.echoApi?.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasSeenNotifications = notifications.some((n) => n.isRead);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden shadow-2xl border border-black/[0.08]">
      {/* Windows Native Title Bar */}
      <WindowsTitleBar title="Echo Inbox" />

      {/* Header Bar */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-black/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-xs font-semibold text-ink-soft truncate max-w-[200px]">
            {session?.email || "Echo Desktop"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenPair}
            title="Pair Mobile Device"
            className="px-2.5 py-1 text-xs font-semibold text-ink-soft bg-black/[0.04] hover:bg-black/[0.08] active:scale-95 rounded-lg transition-all flex items-center gap-1.5"
          >
            <QrCode size={13} />
            <span>Pair</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            className={`p-1.5 text-xs rounded-lg transition-all ${
              showSettings
                ? "bg-ink text-white"
                : "text-ink-soft bg-black/[0.04] hover:bg-black/[0.08]"
            }`}
          >
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="px-6 py-3 bg-white/60 backdrop-blur-md border-b border-black/[0.06] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">Launch on Windows startup</span>
            <input
              type="checkbox"
              checked={autoStart}
              onChange={handleToggleAutoStart}
              className="w-4 h-4 accent-ink cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-black/[0.04]">
            <span className="text-xs text-ink-soft truncate">
              Account: {session?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-ink tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 text-xs font-semibold bg-black/[0.05] hover:bg-black/[0.09] text-ink active:scale-95 rounded-lg transition-all"
                >
                  Mark all read
                </button>
              )}
              {hasSeenNotifications && (
                <button
                  onClick={handleClearRead}
                  className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 active:scale-95 rounded-lg transition-all"
                >
                  Clear seen
                </button>
              )}
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-ink-faint">
              <Inbox size={22} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-ink">All caught up</h3>
              <p className="text-xs text-ink-soft max-w-[220px]">
                New notifications from WhatsApp and Messages on your phone will appear here in real time.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                replyText={expandedId === item.id ? replyText : ""}
                isSending={isSending}
                onToggleExpand={() => {
                  setExpandedId(expandedId === item.id ? null : item.id);
                  if (!item.isRead) {
                    window.echoApi?.markAsRead(item.id);
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                    );
                  }
                }}
                onChangeReplyText={setReplyText}
                onSendReply={() => handleSendReply(item)}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
