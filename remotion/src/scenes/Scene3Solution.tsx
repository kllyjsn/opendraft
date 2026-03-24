import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

const features = [
  { label: "Full source code", desc: "You own every line" },
  { label: "No per-seat fees", desc: "One price, unlimited users" },
  { label: "Deploy in minutes", desc: "Production-ready, instantly" },
  { label: "AI-maintained", desc: "Agents improve it 24/7" },
];

export const Scene3Solution = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headSpring = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 80, mass: 1.5 } });
  const headY = interpolate(headSpring, [0, 1], [80, 0]);
  const headOpacity = interpolate(headSpring, [0, 1], [0, 1]);

  const labelOpacity = interpolate(frame, [10, 30], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "OpenDraft" brand reveal
  const brandSpring = spring({ frame: frame - 40, fps, config: { damping: 15, stiffness: 60, mass: 2 } });
  const brandScale = interpolate(brandSpring, [0, 1], [0.8, 1]);
  const brandOpacity = interpolate(brandSpring, [0, 1], [0, 1]);

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
        fig. 03 — the shift
      </div>

      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        {/* Brand name */}
        <div style={{
          fontFamily: jura,
          fontSize: 18,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "#E8380D",
          marginBottom: 24,
          opacity: brandOpacity,
          transform: `scale(${brandScale})`,
        }}>
          OpenDraft
        </div>

        {/* Headline */}
        <div style={{
          fontFamily: italiana,
          fontSize: 96,
          color: "#FAFAF9",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          transform: `translateY(${headY}px)`,
          opacity: headOpacity,
          marginBottom: 60,
        }}>
          Start owning it.
        </div>

        {/* Feature grid */}
        <div style={{
          display: "flex",
          gap: 32,
          justifyContent: "center",
        }}>
          {features.map((feat, i) => {
            const cardSpring = spring({ frame: frame - 55 - i * 10, fps, config: { damping: 20, stiffness: 120 } });
            const cardY = interpolate(cardSpring, [0, 1], [50, 0]);
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

            return (
              <div key={i} style={{
                width: 280,
                padding: "32px 24px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: jura,
                  fontSize: 20,
                  color: "#FAFAF9",
                  fontWeight: 500,
                  marginBottom: 8,
                  letterSpacing: "0.02em",
                }}>
                  {feat.label}
                </div>
                <div style={{
                  fontFamily: jura,
                  fontSize: 14,
                  color: "rgba(250,250,249,0.4)",
                  letterSpacing: "0.04em",
                }}>
                  {feat.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
