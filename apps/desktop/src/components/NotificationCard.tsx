import type { ReactElement } from "react";
import { MessageSquare, Mail, Send } from "lucide-react";
import type { NotificationItem } from "@echo/shared-types";

interface NotificationCardProps {
  item: NotificationItem;
  isExpanded: boolean;
  replyText: string;
  isSending: boolean;
  onToggleExpand: () => void;
  onChangeReplyText: (text: string) => void;
  onSendReply: () => void;
  formatTime: (timestamp: number) => string;
}

export function NotificationCard({
  item,
  isExpanded,
  replyText,
  isSending,
  onToggleExpand,
  onChangeReplyText,
  onSendReply,
  formatTime,
}: NotificationCardProps): ReactElement {
  const isWhatsApp = item.packageName.includes("whatsapp");

  return (
    <div
      onClick={onToggleExpand}
      className={`rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all cursor-pointer ${
        !item.isRead
          ? "border-black/[0.08] bg-white shadow-md"
          : "border border-black/[0.05] bg-white/70 opacity-75 hover:opacity-100 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* App Icon Badge */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
            isWhatsApp
              ? "bg-gradient-to-br from-[#4ade80] to-[#22c55e]"
              : "bg-gradient-to-br from-sky to-[#0ea5e9]"
          }`}
        >
          {isWhatsApp ? (
            <MessageSquare size={16} strokeWidth={2.2} />
          ) : (
            <Mail size={16} strokeWidth={2.2} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-ink truncate leading-tight flex items-center gap-2">
              <span>{item.title}</span>
              {!item.isRead && (
                <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] font-extrabold rounded-full uppercase tracking-wider leading-none shadow-xs">
                  NEW
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-ink-faint shrink-0">
              {formatTime(item.postedAt)}
            </span>
          </div>
          <div className="text-xs text-ink-soft line-clamp-2 leading-relaxed mt-1">
            {item.text}
          </div>
        </div>
      </div>

      {/* Inline Quick Reply */}
      {isExpanded && item.hasReplyAction && (
        <div
          className="pt-2 border-t border-black/[0.05] flex items-center gap-2 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            autoFocus
            value={replyText}
            onChange={(e) => onChangeReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendReply();
            }}
            placeholder={`Reply to ${item.title}...`}
            disabled={isSending}
            className="flex-1 h-8 px-3 bg-white/80 rounded-xl text-xs text-ink placeholder:text-ink-faint border border-black/[0.08] outline-none focus:border-primary transition-all"
          />
          <button
            onClick={onSendReply}
            disabled={!replyText.trim() || isSending}
            className="px-3 h-8 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-black/90 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            {isSending ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={12} />
            )}
            <span>Send</span>
          </button>
        </div>
      )}
    </div>
  );
}
