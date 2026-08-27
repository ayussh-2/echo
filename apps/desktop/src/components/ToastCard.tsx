import type { ReactElement } from "react";
import { MessageSquare, Mail, X, ArrowUp } from "lucide-react";
import type { NotificationItem } from "@echo/shared-types";

interface ToastCardProps {
  notification: NotificationItem;
  index: number;
  progress: number;
  replyText: string;
  isSending: boolean;
  onChangeReplyText: (text: string) => void;
  onSendReply: () => void;
  onDismiss: () => void;
}

export function ToastCard({
  notification,
  index,
  progress,
  replyText,
  isSending,
  onChangeReplyText,
  onSendReply,
  onDismiss,
}: ToastCardProps): ReactElement {
  const isWhatsApp = notification.packageName.includes("whatsapp");
  const isLatest = index === 0;

  return (
    <div
      className={`w-full glass-card p-3.5 shadow-toast flex flex-col gap-2.5 rounded-2xl border transition-all animate-in fade-in slide-from-bottom-2 duration-200 relative overflow-hidden ${
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
          onClick={onDismiss}
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
            value={replyText}
            onChange={(e) => onChangeReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSendReply();
              } else if (e.key === "Escape") {
                onDismiss();
              }
            }}
            placeholder={`Reply to ${notification.title}...`}
            disabled={isSending}
            className="flex-1 h-8 px-3.5 bg-white/80 backdrop-blur-md rounded-full text-xs text-ink placeholder:text-ink-faint border border-black/[0.08] outline-none focus:border-primary transition-all"
          />
          <button
            onClick={onSendReply}
            disabled={!replyText.trim() || isSending}
            className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-xs font-bold hover:bg-black/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
          >
            {isSending ? (
              <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp size={13} strokeWidth={2.5} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
