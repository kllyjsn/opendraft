import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export function ImageGallery({ images, title = "Screenshot" }: ImageGalleryProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = useCallback(() => setActiveImg((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActiveImg((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, prev, next]);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl aspect-video gradient-hero opacity-40 flex items-center justify-center ring-1 ring-border/40">
        <span className="text-6xl">⚡</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative rounded-2xl overflow-hidden bg-muted aspect-video ring-1 ring-border/40 shadow-card group/gallery cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={images[activeImg]}
            alt={`${title} ${activeImg + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/gallery:scale-[1.02]"
          />
          {/* Zoom hint */}
          <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4" />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-all duration-200 border border-white/10 opacity-0 group-hover/gallery:opacity-100 hover:scale-110"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-all duration-200 border border-white/10 opacity-0 group-hover/gallery:opacity-100 hover:scale-110"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeImg === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImg === i ? "border-primary shadow-glow" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.img
              key={activeImg}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={images[activeImg]}
              alt={`${title} ${activeImg + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {activeImg + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
