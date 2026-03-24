import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

export const Scene1Hook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "You" rises first
  const youSpring = spring({ frame, fps, config: { damping: 20, stiffness: 80, mass: 1.5 } });
  const youY = interpolate(youSpring, [0, 1], [120, 0]);
  const youOpacity = interpolate(youSpring, [0, 1], [0, 1]);

  // "deserve more." follows
  const deserveSpring = spring({ frame: frame - 12, fps, config: { damping: 20, stiffness: 80, mass: 1.5 } });
  const deserveY = interpolate(deserveSpring, [0, 1], [120, 0]);
  const deserveOpacity = interpolate(deserveSpring, [0, 1], [0, 1]);

  // Subtitle fades in
  const subOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [50, 70], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Specimen label
  const labelOpacity = interpolate(frame, [30, 50], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Vermillion accent line
  const lineWidth = interpolate(frame, [20, 60], [0, 320], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Chevron rising
  const chevronY = interpolate(frame, [0, 150], [40, -20]);
  const chevronOpacity = interpolate(frame, [60, 80], [0, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Rising chevron motif */}
      <div style={{
        position: "absolute",
        right: 160,
        top: 200 + chevronY,
        opacity: chevronOpacity,
        fontSize: 280,
        fontFamily: jura,
        fontWeight: 300,
        color: "#E8380D",
        lineHeight: 1,
        userSelect: "none",
      }}>
        ↗
      </div>

      {/* Specimen label */}
      <div style={{
        position: "absolute",
        top: 80,
        left: 120,
        opacity: labelOpacity,
        fontFamily: "monospace",
        fontSize: 11,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}>
        fig. 01 — the premise
      </div>

      {/* Main headline */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: italiana,
          fontSize: 130,
          fontWeight: 400,
          color: "#FAFAF9",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          transform: `translateY(${youY}px)`,
          opacity: youOpacity,
        }}>
          You
        </div>
        <div style={{
          fontFamily: italiana,
          fontSize: 130,
          fontWeight: 400,
          color: "#E8380D",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          transform: `translateY(${deserveY}px)`,
          opacity: deserveOpacity,
        }}>
          deserve more.
        </div>

        {/* Vermillion accent line */}
        <div style={{
          width: lineWidth,
          height: 2,
          background: "#E8380D",
          margin: "24px auto 0",
          opacity: 0.6,
        }} />

        {/* Subtitle */}
        <div style={{
          fontFamily: jura,
          fontSize: 26,
          color: "rgba(250,250,249,0.5)",
          marginTop: 32,
          letterSpacing: "0.08em",
          fontWeight: 300,
          transform: `translateY(${subY}px)`,
          opacity: subOpacity,
        }}>
          More from your career. More from your tools.
        </div>
      </div>
    </AbsoluteFill>
  );
};
