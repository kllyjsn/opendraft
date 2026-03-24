import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

const saasItems = [
  { label: "$240/yr per seat", delay: 0 },
  { label: "No source code", delay: 8 },
  { label: "Vendor lock-in", delay: 16 },
  { label: "Feature requests ignored", delay: 24 },
];

export const Scene2Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headSpring = spring({ frame, fps, config: { damping: 25, stiffness: 100 } });
  const headOpacity = interpolate(headSpring, [0, 1], [0, 1]);
  const headY = interpolate(headSpring, [0, 1], [60, 0]);

  // "Stop renting" flash
  const flashOpacity = interpolate(frame, [70, 85, 85, 100], [0, 1, 1, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashScale = interpolate(frame, [70, 90], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Label
  const labelOpacity = interpolate(frame, [10, 30], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 160px" }}>
      {/* Specimen label */}
      <div style={{
        position: "absolute",
        top: 80, left: 120,
        opacity: labelOpacity,
        fontFamily: "monospace",
        fontSize: 11,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}>
        fig. 02 — the trap
      </div>

      <div style={{ display: "flex", gap: 120, alignItems: "center" }}>
        {/* Left: SaaS pain points */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: italiana,
            fontSize: 64,
            color: "#FAFAF9",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            opacity: headOpacity,
            transform: `translateY(${headY}px)`,
            marginBottom: 48,
          }}>
            You're paying rent<br />on your own workflow.
          </div>

          {/* Pain point list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {saasItems.map((item, i) => {
              const itemSpring = spring({ frame: frame - 25 - item.delay, fps, config: { damping: 20, stiffness: 120 } });
              const itemX = interpolate(itemSpring, [0, 1], [-40, 0]);
              const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);

              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                }}>
                  <div style={{
                    width: 8, height: 8,
                    borderRadius: "50%",
                    background: "#E8380D",
                    opacity: 0.7,
                  }} />
                  <span style={{
                    fontFamily: jura,
                    fontSize: 22,
                    color: "rgba(250,250,249,0.6)",
                    letterSpacing: "0.04em",
                  }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: "Stop renting" bold declaration */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            fontFamily: italiana,
            fontSize: 88,
            color: "#E8380D",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            textAlign: "center",
            opacity: flashOpacity,
            transform: `scale(${flashScale})`,
          }}>
            Stop<br />renting<br />software.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
