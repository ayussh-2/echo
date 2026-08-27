import { useState, useEffect, type ReactElement } from "react";
import QRCode from "qrcode";
import { encodePairingPayload } from "@echo/crypto";
import type { PairingPayload } from "@echo/shared-types";
import { WindowsTitleBar } from "../components/WindowsTitleBar";
import type { UserSession } from "../types/electron";

export function PairView(): ReactElement {
  const [session, setSession] = useState<UserSession | null>(null);
  const [pairingPayload, setPairingPayload] = useState<PairingPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTriggeringTest, setIsTriggeringTest] = useState<boolean>(false);

  // Check for existing session
  useEffect(() => {
    window.echoApi?.getStoredSession?.().then((stored) => {
      if (stored) {
        setSession(stored);
      }
    });

    const unsubscribe = window.echoApi?.onSessionChanged?.((s) => {
      setSession(s);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // When session is available, generate QR pairing payload & countdown
  useEffect(() => {
    if (!session?.uid) return;

    const generatePayload = async () => {
      try {
        const payload = await window.echoApi?.createPairingSession("Echo for Windows");
        if (payload) {
          setPairingPayload(payload);
          setSecondsRemaining(120);

          const url = await QRCode.toDataURL(encodePairingPayload(payload), {
            width: 180,
            margin: 1,
            color: {
              dark: "#0b0f14",
              light: "#ffffff",
            },
          });
          setQrDataUrl(url);
        }
      } catch {
        // Fallback
      }
    };

    generatePayload();

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generatePayload();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.uid]);

  const handleStartGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    if (!window.echoApi?.startGoogleAuth) {
      setAuthError("Echo Electron bridge is not initialized. Please restart the desktop app via `bun run dev`.");
      setIsLoadingAuth(false);
      return;
    }

    try {
      const result = await window.echoApi.startGoogleAuth();
      if (!result?.success || !result.session) {
        setAuthError(result?.error || "Sign-in failed. Please check your .env credentials.");
      } else {
        setSession(result.session);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleProceedToInbox = () => {
    window.location.hash = "inbox";
  };

  const handleTriggerTestNotification = async () => {
    setIsTriggeringTest(true);
    try {
      await window.echoApi?.sendTestNotification();
    } finally {
      setTimeout(() => setIsTriggeringTest(false), 800);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel overflow-hidden shadow-2xl border border-white/60">
      <div className="ambient-bg" />

      {/* Windows Native Title Bar */}
      <WindowsTitleBar title="Echo Setup & Pairing" />

      {/* Body Content */}
      <div className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-3.5">
        {!session ? (
          <div className="flex flex-col items-center gap-4 max-w-[300px]">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-ink tracking-tight">Login to Echo</h2>
              <p className="text-xs text-ink-soft leading-relaxed">
                Sign in to link Echo with your Android phone and sync notifications seamlessly.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs leading-snug break-words max-w-[280px]">
                {authError}
              </div>
            )}

            <button
              onClick={handleStartGoogleSignIn}
              disabled={isLoadingAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-ink text-white font-medium text-xs hover:bg-black/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingAuth ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Waiting for browser sign-in...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* QR Box */}
            <div className="p-2.5 bg-white/95 rounded-2xl shadow-md border border-black/[0.04]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Pairing QR Code"
                  className="w-36 h-36 rounded-xl"
                />
              ) : (
                <div className="w-36 h-36 bg-black/5 animate-pulse rounded-xl" />
              )}
            </div>

            {/* Signed In Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-xs font-semibold text-ink border border-black/[0.06] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate max-w-[200px]">{session.email}</span>
            </div>

            {/* Code & Expiry */}
            <div className="px-3 py-0.5 bg-black/[0.04] rounded-full text-[10px] font-bold tracking-wider text-ink-soft uppercase">
              CODE {pairingPayload?.code ?? "—"} · EXPIRES IN {formatCountdown(secondsRemaining)}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col w-full max-w-[260px] gap-2 mt-1">
              <button
                onClick={handleProceedToInbox}
                className="w-full py-2.5 px-4 rounded-xl bg-ink text-white font-bold text-xs hover:bg-black/90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Notifications Inbox</span>
                <span>→</span>
              </button>

              <button
                onClick={handleTriggerTestNotification}
                disabled={isTriggeringTest}
                className="w-full py-2 px-3 rounded-xl bg-white/70 hover:bg-white text-ink font-semibold text-xs border border-black/[0.06] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>🔔</span>
                <span>{isTriggeringTest ? "Sending Toast..." : "Test Toast Popup"}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
