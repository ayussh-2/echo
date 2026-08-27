import type { ReactElement } from "react";

interface WindowsTitleBarProps {
  title?: string;
}

export function WindowsTitleBar({
  title = "Echo",
}: WindowsTitleBarProps): ReactElement {
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.echoApi?.closeWindow) {
      window.echoApi.closeWindow();
    } else {
      window.close();
    }
  };

  return (
    <header className="h-9 w-full flex items-stretch justify-between border-b border-black/[0.06] bg-white/40 backdrop-blur-md select-none text-ink-soft relative z-50">
      {/* Draggable Title Area */}
      <div
        className="flex-1 h-full pl-3.5 flex items-center gap-2 cursor-default"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-bold tracking-tight text-ink">{title}</span>
      </div>

      {/* Non-draggable Close Button */}
      <div
        className="flex items-stretch h-full z-10"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={handleClose}
          title="Close"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="w-11 h-full flex items-center justify-center text-ink-soft hover:bg-[#e81123] hover:text-white active:bg-[#c4101e] transition-colors cursor-pointer"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="pointer-events-none"
          >
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
