"use client";
import { useRef, useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { cropBox, type Crop } from "@/lib/photo";

/** Drag to move, slide to zoom. What is inside the frame is what gets saved. */
export function Cropper({ src, onChange }: { src: string; onChange: (c: Crop) => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<Crop>({ cx: 0, cy: 0, zoom: 1 });
  const last = useRef<{ x: number; y: number } | null>(null);
  const box = size ? cropBox(size.w, size.h, crop) : null;

  function apply(next: Crop) {
    if (!size) return;
    const b = cropBox(size.w, size.h, next); // keep the centre inside the picture
    const clamped = { zoom: next.zoom, cx: b.sx + b.sw / 2, cy: b.sy + b.sh / 2 };
    setCrop(clamped);
    onChange(clamped);
  }

  function init(img: HTMLImageElement) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const start = { cx: w / 2, cy: h / 2, zoom: 1 };
    setSize({ w, h }); setCrop(start); onChange(start);
  }

  return (
    <div className="w-full max-w-xs">
      <div className="relative aspect-square w-full touch-none select-none overflow-hidden border border-ink"
        onPointerDown={(e) => { last.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={() => { last.current = null; }}
        onPointerMove={(e) => {
          if (!last.current || !box) return;
          const scale = box.sw / e.currentTarget.clientWidth;
          apply({ ...crop, cx: crop.cx - (e.clientX - last.current.x) * scale, cy: crop.cy - (e.clientY - last.current.y) * scale });
          last.current = { x: e.clientX, y: e.clientY };
        }}>
        <img src={src} alt="Drag to position your photo" draggable={false}
          onLoad={(e) => init(e.currentTarget)}
          // The picture may already be loaded before this component is listening.
          ref={(el) => { if (el?.complete && el.naturalWidth && !size) init(el); }}
          className="absolute max-w-none"
          style={box && size ? { width: `${(size.w / box.sw) * 100}%`, left: `${-(box.sx / box.sw) * 100}%`, top: `${-(box.sy / box.sh) * 100}%` } : { opacity: 0 }} />
      </div>
      <label className="mt-2 flex min-h-11 items-center gap-3">
        <span className="lbl">Zoom</span>
        <input type="range" min={1} max={4} step={0.01} value={crop.zoom} onChange={(e) => apply({ ...crop, zoom: Number(e.target.value) })} className="flex-1 accent-black" />
      </label>
      <p className="text-[13px]">Drag the photo to position it.</p>
    </div>
  );
}
