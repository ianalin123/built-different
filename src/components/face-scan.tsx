"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnSecondary } from "@/components/ui";

type Phase = "idle" | "live" | "scanning" | "captured" | "error";

const STATUS: Record<Phase, string> = {
  idle: "CAMERA OFF",
  live: "ALIGN FACE IN FRAME",
  scanning: "SCANNING…",
  captured: "FACE CAPTURED",
  error: "CAMERA UNAVAILABLE",
};

export function FaceScan({ initialImage }: { initialImage: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>(initialImage ? "captured" : "idle");
  const [image, setImage] = useState<string | null>(initialImage);
  const [flash, setFlash] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopStream, [stopStream]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1024 }, height: { ideal: 1024 } },
      });
      streamRef.current = stream;
      setPhase("live");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch {
      setPhase("error");
    }
  }

  function scan() {
    setPhase("scanning");
    setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) {
        setPhase("live");
        return;
      }
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      // mirror the capture so it matches the mirrored preview
      ctx.translate(512, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, side, side, 0, 0, 512, 512);
      setImage(canvas.toDataURL("image/jpeg", 0.82));
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      setPhase("captured");
      stopStream();
    }, 1700);
  }

  return (
    <div className="w-full max-w-[280px]">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-ink">
        {(phase === "live" || phase === "scanning") && (
          <video
            ref={videoRef}
            muted
            playsInline
            className="absolute inset-0 size-full -scale-x-100 object-cover"
          />
        )}
        {phase === "captured" && image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Captured face" className="absolute inset-0 size-full object-cover" />
        )}
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl text-cream/25">
            ◉
          </div>
        )}
        {phase === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center font-mono text-[11px] uppercase tracking-widest text-rust">
            camera permission denied
          </div>
        )}

        {phase === "scanning" && (
          <>
            <div className="scan-grid absolute inset-0" />
            <div className="scanline" />
          </>
        )}
        {flash && (
          <div className="absolute inset-0 bg-white" style={{ animation: "scan-flash 0.4s ease-out forwards" }} />
        )}

        {/* corner brackets */}
        {["top-3 left-3 border-t-2 border-l-2", "top-3 right-3 border-t-2 border-r-2",
          "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2",
        ].map((pos) => (
          <div key={pos} className={`absolute size-6 rounded-[2px] border-accent ${pos}`} />
        ))}
      </div>

      <p className="mt-2 text-center font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-ink-3">
        {phase === "captured" && image
          ? `${STATUS.captured} · ${Math.round((image.length * 3) / 4 / 1024)}KB`
          : STATUS[phase]}
      </p>

      <div className="mt-3 flex justify-center gap-2">
        {phase === "idle" || phase === "error" ? (
          <button type="button" onClick={startCamera} className={btnSecondary}>
            Start camera
          </button>
        ) : phase === "live" ? (
          <button
            type="button"
            onClick={scan}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-bold text-white transition hover:bg-accent-dark hover:shadow-[0_4px_16px_rgba(124,111,247,0.35)]"
          >
            ◉ Scan face
          </button>
        ) : phase === "scanning" ? (
          <button type="button" disabled className={`${btnSecondary} opacity-50`}>
            Scanning…
          </button>
        ) : (
          <button type="button" onClick={startCamera} className={btnSecondary}>
            Retake scan
          </button>
        )}
      </div>

      <input type="hidden" name="face_image" value={image ?? ""} />
    </div>
  );
}
