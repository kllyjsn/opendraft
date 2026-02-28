import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const SIZES = [
  { label: "X / Twitter (400×400)", w: 400, h: 400 },
  { label: "LinkedIn (800×800)", w: 800, h: 800 },
  { label: "Favicon (512×512)", w: 512, h: 512 },
  { label: "Large (1024×1024)", w: 1024, h: 1024 },
];

/** Static mascot SVG without framer-motion for clean export */
function MascotSVG({ size }: { size: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const bodyR = s * 0.34;

  const leftEyeCx = cx - bodyR * 0.3;
  const leftEyeCy = cy - bodyR * 0.15;
  const rightEyeCx = cx + bodyR * 0.3;
  const rightEyeCy = cy - bodyR * 0.15;

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle for profile pic */}
      <circle cx={cx} cy={cy} r={s * 0.48} fill="hsl(265 30% 15%)" />

      {/* Tail */}
      <path
        d={`M${cx + bodyR * 0.5} ${cy + bodyR * 0.2} Q${cx + bodyR * 1.1} ${cy - bodyR * 0.3} ${cx + bodyR * 0.9} ${cy - bodyR * 0.7}`}
        stroke="hsl(265 85% 58%)" strokeWidth={s * 0.05} strokeLinecap="round" fill="none"
      />

      {/* Body */}
      <circle cx={cx} cy={cy} r={bodyR} fill="hsl(265 85% 58%)" />

      {/* Belly */}
      <ellipse cx={cx} cy={cy + bodyR * 0.15} rx={bodyR * 0.55} ry={bodyR * 0.5} fill="hsl(265 85% 72%)" opacity={0.5} />

      {/* Left ear */}
      <ellipse cx={cx - bodyR * 0.55} cy={cy - bodyR * 0.75} rx={bodyR * 0.22} ry={bodyR * 0.35} fill="hsl(265 85% 58%)" transform={`rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`} />
      <ellipse cx={cx - bodyR * 0.55} cy={cy - bodyR * 0.75} rx={bodyR * 0.12} ry={bodyR * 0.22} fill="hsl(330 90% 60%)" opacity={0.6} transform={`rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`} />

      {/* Right ear */}
      <ellipse cx={cx + bodyR * 0.55} cy={cy - bodyR * 0.75} rx={bodyR * 0.22} ry={bodyR * 0.35} fill="hsl(265 85% 58%)" transform={`rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`} />
      <ellipse cx={cx + bodyR * 0.55} cy={cy - bodyR * 0.75} rx={bodyR * 0.12} ry={bodyR * 0.22} fill="hsl(330 90% 60%)" opacity={0.6} transform={`rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`} />

      {/* Left eye */}
      <ellipse cx={leftEyeCx} cy={leftEyeCy} rx={bodyR * 0.22} ry={bodyR * 0.26} fill="white" />
      <circle cx={leftEyeCx} cy={leftEyeCy} r={bodyR * 0.12} fill="hsl(240 10% 10%)" />
      <circle cx={leftEyeCx + bodyR * 0.04} cy={leftEyeCy - bodyR * 0.07} r={bodyR * 0.045} fill="white" />

      {/* Right eye */}
      <ellipse cx={rightEyeCx} cy={rightEyeCy} rx={bodyR * 0.22} ry={bodyR * 0.26} fill="white" />
      <circle cx={rightEyeCx} cy={rightEyeCy} r={bodyR * 0.12} fill="hsl(240 10% 10%)" />
      <circle cx={rightEyeCx + bodyR * 0.04} cy={rightEyeCy - bodyR * 0.07} r={bodyR * 0.045} fill="white" />

      {/* Smile */}
      <path
        d={`M${cx - bodyR * 0.2} ${cy + bodyR * 0.2} Q${cx} ${cy + bodyR * 0.45} ${cx + bodyR * 0.2} ${cy + bodyR * 0.2}`}
        stroke="hsl(240 10% 10%)" strokeWidth={s * 0.02} strokeLinecap="round" fill="none"
      />

      {/* Cheeks */}
      <circle cx={cx - bodyR * 0.5} cy={cy + bodyR * 0.1} r={bodyR * 0.1} fill="hsl(330 90% 60%)" opacity={0.35} />
      <circle cx={cx + bodyR * 0.5} cy={cy + bodyR * 0.1} r={bodyR * 0.1} fill="hsl(330 90% 60%)" opacity={0.35} />

      {/* Feet */}
      <ellipse cx={cx - bodyR * 0.3} cy={cy + bodyR * 0.85} rx={bodyR * 0.18} ry={bodyR * 0.1} fill="hsl(265 70% 48%)" />
      <ellipse cx={cx + bodyR * 0.3} cy={cy + bodyR * 0.85} rx={bodyR * 0.18} ry={bodyR * 0.1} fill="hsl(265 70% 48%)" />

      {/* Arms */}
      <ellipse cx={cx - bodyR * 0.8} cy={cy + bodyR * 0.15} rx={bodyR * 0.12} ry={bodyR * 0.18} fill="hsl(265 85% 58%)" transform={`rotate(-20 ${cx - bodyR * 0.8} ${cy + bodyR * 0.15})`} />
      <ellipse cx={cx + bodyR * 0.8} cy={cy + bodyR * 0.15} rx={bodyR * 0.12} ry={bodyR * 0.18} fill="hsl(265 85% 58%)" transform={`rotate(20 ${cx + bodyR * 0.8} ${cy + bodyR * 0.15})`} />

      {/* Antenna */}
      <circle cx={cx} cy={cy - bodyR * 1.05} r={bodyR * 0.08} fill="hsl(185 90% 45%)" />
      <line x1={cx} y1={cy - bodyR * 0.95} x2={cx} y2={cy - bodyR * 0.7} stroke="hsl(185 90% 45%)" strokeWidth={s * 0.02} strokeLinecap="round" />
    </svg>
  );
}

export default function MascotExport() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const { w, h } = SIZES[selected];

  const handleDownload = useCallback(() => {
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = `opendraft-mascot-${w}x${h}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }, [w, h]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-black">Export Mascot</h1>
      <div className="flex gap-2 flex-wrap justify-center">
        {SIZES.map((sz, i) => (
          <Button key={i} variant={i === selected ? "default" : "outline"} size="sm" onClick={() => setSelected(i)}>
            {sz.label}
          </Button>
        ))}
      </div>
      <div ref={svgRef} className="border border-border rounded-xl p-4 bg-card">
        <MascotSVG size={Math.min(w, 400)} />
      </div>
      <Button onClick={handleDownload} className="gap-2">
        <Download className="h-4 w-4" /> Download PNG ({w}×{h})
      </Button>
    </div>
  );
}
