import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

const trajectories = [
  { from: "Stuck in your role", to: "Promoted to lead", icon: "↗" },
  { from: "Searching for months", to: "Hired in weeks", icon: "◆" },
  { from: "Renting generic SaaS", to: "Owning custom tools", icon: "■" },
];

export const Scene4Jobs = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [10, 30], [0, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Main headline
  const headSpring = spring({ frame, fps, config: { damping: 20, stiffness: 80, mass: 1.5 } });
  const headOpacity = interpolate(headSpring, [0, 1], [0, 1]);
  const headY = interpolate(headSpring, [0, 1], [60, 0]);

  // Sub headline
  const subSpring = spring({ frame: frame - 20, fps, config: { damping: 25, stiffness: 100 } });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 140px" }}>
      {/* Specimen label */}
      <div style={{
        position: "absolute", top: 80, left: 120,
        opacity: labelOpacity,
        fontFamily: "monospace", fontSize: 11,
        letterSpacing: "0.3em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}>
        fig. 04 — the trajectory
      </div>

      {/* Left side: headline */}
      <div style={{ display: "flex", gap: 100, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: italiana,
            fontSize: 82,
            color: "#FAFAF9",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            transform: `translateY(${headY}px)`,
            opacity: headOpacity,
            marginBottom: 20,
          }}>
            Improve your company.
          </div>
          <div style={{
            fontFamily: italiana,
            fontSize: 82,
            color: "#E8380D",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            opacity: subOpacity,
            marginBottom: 32,
          }}>
            Get promoted.
          </div>
          <div style={{
            fontFamily: jura,
            fontSize: 20,
            color: "rgba(250,250,249,0.45)",
            letterSpacing: "0.06em",
            lineHeight: 1.6,
            maxWidth: 480,
            opacity: interpolate(frame, [45, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            Build the tools your team needs. Show leadership the impact.<br />
            Or land your next role with a portfolio that proves you ship.
          </div>
        </div>

        {/* Right: Career trajectories */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
          {trajectories.map((t, i) => {
            const rowSpring = spring({ frame: frame - 40 - i * 14, fps, config: { damping: 20, stiffness: 120 } });
            const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1]);
            const rowX = interpolate(rowSpring, [0, 1], [60, 0]);

            // Arrow animation
            const arrowWidth = interpolate(frame,
              [55 + i * 14, 80 + i * 14],
              [0, 80],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div key={i} style={{
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                display: "flex", alignItems: "center", gap: 20,
              }}>
                {/* From */}
                <div style={{
                  fontFamily: jura,
                  fontSize: 16,
                  color: "rgba(250,250,249,0.3)",
                  letterSpacing: "0.04em",
                  width: 200,
                  textAlign: "right",
                  textDecoration: "line-through",
                  textDecorationColor: "rgba(232,56,13,0.4)",
                }}>
                  {t.from}
                </div>

                {/* Arrow */}
                <div style={{
                  width: arrowWidth,
                  height: 2,
                  background: "linear-gradient(90deg, rgba(232,56,13,0.2), #E8380D)",
                  borderRadius: 1,
                }} />

                {/* To */}
                <div style={{
                  fontFamily: jura,
                  fontSize: 18,
                  color: "#FAFAF9",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}>
                  {t.to}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
