"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxFile {
  type: "image" | "video";
  url: string;
  thumbnail?: string | null;
  filename: string;
}

interface LightboxProps {
  files: LightboxFile[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ files, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const current = files[index];

  const prev = useCallback(() => { setZoom(1); setIndex(i => Math.max(0, i - 1)); }, []);
  const next = useCallback(() => { setZoom(1); setIndex(i => Math.min(files.length - 1, i + 1)); }, [files.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
        {current.type === "image" && (
          <>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.5))}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(1, z - 0.5))}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </>
        )}
        <a
          href={current.url}
          download={current.filename}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filename */}
      <div className="absolute top-4 left-4 text-white/60 text-sm truncate max-w-xs">
        {current.filename}
        {files.length > 1 && <span className="ml-2 text-white/40">{index + 1} / {files.length}</span>}
      </div>

      {/* Prev / Next */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {index < files.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Media */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {current.type === "image" ? (
          <img
            src={current.url}
            alt={current.filename}
            className="max-w-full max-h-[85vh] object-contain rounded-lg transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <video
            src={current.url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-lg"
            poster={current.thumbnail || undefined}
          />
        )}
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={e => e.stopPropagation()}>
          {files.map((f, i) => (
            <button
              key={i}
              onClick={() => { setZoom(1); setIndex(i); }}
              className={cn(
                "h-12 w-12 rounded-lg overflow-hidden border-2 transition-all",
                i === index ? "border-white scale-110" : "border-white/20 opacity-50 hover:opacity-80"
              )}
            >
              <img
                src={f.thumbnail || f.url}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
