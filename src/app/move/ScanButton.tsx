"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { codeFrom, sendCheckIn } from "@/lib/check-in";

/** Opens the camera, reads the founder's QR code and checks in. */
export function ScanButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setMsg("No camera access. Scan the code with your phone's camera instead.");
        setScanning(false);
        return;
      }
      const v = video.current;
      if (stopped || !v) { stream.getTracks().forEach((t) => t.stop()); return; }
      v.srcObject = stream;
      await v.play();
      const tick = async () => {
        if (stopped) return;
        if (v.videoWidth) {
          canvas.width = v.videoWidth; canvas.height = v.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(v, 0, 0);
          const found = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          const code = found ? codeFrom(found.data) : null;
          if (code) {
            stopped = true;
            const result = await sendCheckIn(code);
            setMsg(result.message);
            setScanning(false);
            router.refresh();
            return;
          }
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    void start();
    return () => { stopped = true; cancelAnimationFrame(frame); stream?.getTracks().forEach((t) => t.stop()); };
  }, [scanning, router]);

  return (
    <div className="flex flex-col gap-3">
      {scanning ? (
        <>
          <video ref={video} playsInline muted className="aspect-square w-full border border-offwhite object-cover" />
          <button type="button" onClick={() => setScanning(false)} className="btn border-offwhite text-offwhite">Stop</button>
        </>
      ) : (
        <button type="button" disabled={!enabled} onClick={() => { setMsg(""); setScanning(true); }}
          className="btn border-offwhite bg-offwhite text-ink disabled:opacity-60">Scan to check-in</button>
      )}
      {msg && <p role="status" className="border border-offwhite p-3 text-sm font-bold">{msg}</p>}
    </div>
  );
}
