import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

export const Scene5CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Own your future" headline
  const headSpring = spring({ frame, fps, config: { damping: 15, stiffness: 60, mass: 2 } });
  const headScale = interpolate(headSpring, [0, 1], [0.85, 1]);
  const headOpacity = interpolate(headSpring, [0, 1], [0, 1]);

  // URL
  const urlSpring = spring({ frame: frame - 35, fps, config: { damping: 20, stiffness: 100 } });
  const urlOpacity = interpolate(urlSpring, [0, 1], [0, 1]);
  const urlY = interpolate(urlSpring, [0, 1], [30, 0]);

  // Tagline
  const tagOpacity = interpolate(frame, [50, 70], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Accent ring
  const ringScale = interpolate(frame, [0, 120], [0.5, 1.2], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [0, 30, 100, 140], [0, 0.08, 0.08, 0.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulsing glow
  const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;

  const labelOpacity = interpolate(frame, [10, 30], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Specimen label */}
      <div style={{
        position: "absolute", top: 80, left: 120,
        opacity: labelOpacity,
        fontFamily: "monospace", fontSize: 11,
        letterSpacing: "0.3em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}>
        fig. 05 — the invitation
      </div>

      {/* Accent ring */}
      <div style={{
        position: "absolute",
        width: 600, height: 600,
        borderRadius: "50%",
        border: "1px solid #E8380D",
        opacity: ringOpacity,
        transform: `scale(${ringScale})`,
      }} />

      {/* Second ring */}
      <div style={{
        position: "absolute",
        width: 800, height: 800,
        borderRadius: "50%",
        border: "1px solid #E8380D",
        opacity: ringOpacity * 0.5,
        transform: `scale(${ringScale * 0.9})`,
      }} />

      <div style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
        {/* Brand */}
        <div style={{
          fontFamily: jura,
          fontSize: 16,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(232,56,13,0.7)",
          marginBottom: 32,
          opacity: headOpacity,
        }}>
          OpenDraft
        </div>

        {/* Main headline */}
        <div style={{
          fontFamily: italiana,
          fontSize: 120,
          color: "#FAFAF9",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          opacity: headOpacity,
          transform: `scale(${headScale})`,
          marginBottom: 16,
        }}>
          Own your future.
        </div>

        {/* Vermillion accent */}
        <div style={{
          width: 80,
          height: 3,
          background: "#E8380D",
          margin: "0 auto 40px",
          opacity: pulse,
        }} />

        {/* URL */}
        <div style={{
          fontFamily: jura,
          fontSize: 32,
          color: "#E8380D",
          letterSpacing: "0.15em",
          fontWeight: 500,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          marginBottom: 16,
        }}>
          opendraft.co
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: jura,
          fontSize: 18,
          color: "rgba(250,250,249,0.5)",
          letterSpacing: "0.1em",
          opacity: tagOpacity,
        }}>
          Build better tools. Advance your career.
        </div>
      </div>
    </AbsoluteFill>
  );
};
