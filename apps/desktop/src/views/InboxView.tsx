import { useState, type ReactElement } from "react";
import type { NotificationItem } from "@echo/shared-types";
import { WindowsTitleBar } from "../components/WindowsTitleBar";

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    conversationId: "conv-riya",
    title: "Riya Sharma",
    text: "Are we still on for 7 tonight?",
    postedAt: Date.now() - 10 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    hasReplyAction: true,
    isRead: false,
    isGroup: false,
    key: "k1",
  },
  {
    id: "notif-2",
    packageName: "com.google.android.apps.messaging",
    appName: "Messages",
    conversationId: "conv-otp",
    title: "+91 98765 43210",
    text: "Your delivery is arriving today",
    postedAt: Date.now() - 32 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    hasReplyAction: true,
    isRead: false,
    isGroup: false,
    key: "k2",
  },
  {
    id: "notif-3",
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    conversationId: "conv-team",
    title: "Team Standup",
    text: "Dev: pushed the firestore rules ✅",
    postedAt: Date.now() - 78 * 60 * 1000,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    hasReplyAction: true,
    isRead: false,
    isGroup: true,
    groupName: "Team Standup",
    key: "k3",
  },
];

export function InboxView(): ReactElement {
  const [notifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel overflow-hidden shadow-2xl border border-white/60">
      <div className="ambient-bg" />

      {/* Windows Native Title Bar */}
      <WindowsTitleBar title="Echo" />

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink tracking-tight">
            Missed while away
          </h2>
          <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-extrabold rounded-full">
            {notifications.length} new
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {notifications.map((item) => {
            const isWhatsApp = item.packageName.includes("whatsapp");
            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/80 transition-all cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                    isWhatsApp
                      ? "bg-gradient-to-br from-[#4ade80] to-[#22c55e]"
                      : "bg-gradient-to-br from-sky to-[#0ea5e9]"
                  }`}
                >
                  <span className="msi text-[20px]">
                    {isWhatsApp ? "chat" : "sms"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate leading-tight">
                    {item.title}
                  </div>
                  <div className="text-xs text-ink-soft truncate leading-tight mt-1">
                    {item.text}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-ink-faint shrink-0">
                  {formatTime(item.postedAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
