import { useState, useEffect, type ReactElement } from "react";
import QRCode from "qrcode";
import { encodePairingPayload, createPairingPayload } from "@echo/crypto";
import type { PairingPayload } from "@echo/shared-types";
import { WindowsTitleBar } from "../components/WindowsTitleBar";

export function PairView(): ReactElement {
  const [pairingPayload, setPairingPayload] = useState<PairingPayload | null>(
    null,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(107);
  const [userEmail] = useState<string>("you@gmail.com");

  useEffect(() => {
    // Generate pairing payload
    const payload = createPairingPayload("demo-uid-123", "Echo for Windows");
    setPairingPayload(payload);

    QRCode.toDataURL(encodePairingPayload(payload), {
      width: 180,
      margin: 1,
      color: {
        dark: "#0b0f14",
        light: "#ffffff",
      },
    }).then((url) => {
      setQrDataUrl(url);
    });

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="w-full h-full flex flex-col glass-panel overflow-hidden shadow-2xl border border-white/60">
      <div className="ambient-bg" />

      {/* Windows Native Title Bar */}
      <WindowsTitleBar title="Echo Setup" />

      {/* Body Content */}
      <div className="p-8 flex-1 flex flex-col items-center justify-center text-center gap-5">
        {/* QR Box */}
        <div className="p-3 bg-white/90 rounded-2xl shadow-md border border-black/[0.04]">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Pairing QR Code"
              className="w-40 h-40 rounded-xl"
            />
          ) : (
            <div className="w-40 h-40 bg-black/5 animate-pulse rounded-xl" />
          )}
        </div>

        {/* Signed In Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full text-xs font-bold text-ink border border-black/[0.06] shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Signed in as {userEmail}
        </div>

        {/* Caption */}
        <p className="text-xs text-ink-soft max-w-[280px] leading-relaxed">
          Scan this with the Echo app on your phone to confirm it&apos;s the
          same Google account.
        </p>

        {/* Code & Expiry */}
        <div className="px-3.5 py-1.5 bg-black/[0.04] rounded-full text-[11px] font-extrabold tracking-wider text-ink-soft uppercase">
          CODE {pairingPayload?.code ?? "4J9-QXR"} · EXPIRES IN{" "}
          {formatCountdown(secondsRemaining)}
        </div>
      </div>
    </div>
  );
}
