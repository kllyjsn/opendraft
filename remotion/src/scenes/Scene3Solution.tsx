import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Italiana";
import { loadFont as loadJura } from "@remotion/google-fonts/Jura";

const { fontFamily: italiana } = loadFont();
const { fontFamily: jura } = loadJura();

export const Scene3Solution = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Two screenshots side by side — dashboard and builders — with slow drift
  const drift = interpolate(frame, [0, 180], [0, -30], { extrapolateRight: "clamp" });
  
  // Left card (dashboard)
  const leftSpring = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 60, mass: 2 } });
  const leftScale = interpolate(leftSpring, [0, 1], [0.85, 1]);
  const leftOpacity = interpolate(leftSpring, [0, 1], [0, 1]);
  const leftRotate = interpolate(leftSpring, [0, 1], [-3, -2]);

  // Right card (builders)
  const rightSpring = spring({ frame: frame - 25, fps, config: { damping: 18, stiffness: 60, mass: 2 } });
  const rightScale = interpolate(rightSpring, [0, 1], [0.85, 1]);
  const rightOpacity = interpolate(rightSpring, [0, 1], [0, 1]);
  const rightRotate = interpolate(rightSpring, [0, 1], [3, 2]);

  // Heading
  const headSpring = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 80, mass: 1.5 } });
  const headY = interpolate(headSpring, [0, 1], [60, 0]);
  const headOpacity = interpolate(headSpring, [0, 1], [0, 1]);

  const labelOpacity = interpolate(frame, [5, 25], [0, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Feature tags
  const features = ["Full source code", "No per-seat fees", "Deploy instantly", "AI-maintained"];

  return (
    <AbsoluteFill style={{ backgroundColor: "#09080E" }}>
      {/* Specimen label */}
      <div style={{
        position: "absolute", top: 80, left: 120, zIndex: 10,
        opacity: labelOpacity,
        fontFamily: "monospace", fontSize: 11,
        letterSpacing: "0.3em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}>
        fig. 03 — the ecosystem
      </div>

      {/* Heading */}
      <div style={{
        position: "absolute",
        top: 70,
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 5,
      }}>
        <div style={{
          fontFamily: jura,
          fontSize: 16,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: "#E8380D",
          marginBottom: 16,
          opacity: headOpacity,
        }}>
          OpenDraft
        </div>
        <div style={{
          fontFamily: italiana,
          fontSize: 72,
          color: "#FAFAF9",
          letterSpacing: "-0.03em",
          transform: `translateY(${headY}px)`,
          opacity: headOpacity,
        }}>
          Own every line of code.
        </div>
      </div>

      {/* Floating screenshots */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -40%) translateY(${drift}px)`,
        display: "flex",
        gap: 40,
      }}>
        {/* Dashboard screenshot */}
        <div style={{
          width: 640,
          height: 400,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          transform: `scale(${leftScale}) rotate(${leftRotate}deg)`,
          opacity: leftOpacity,
        }}>
          <Img
            src={staticFile("screens/dashboard-demo.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Builders screenshot */}
        <div style={{
          width: 640,
          height: 400,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          transform: `scale(${rightScale}) rotate(${rightRotate}deg)`,
          opacity: rightOpacity,
        }}>
          <Img
            src={staticFile("screens/builders.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </div>

      {/* Feature tags at bottom */}
      <div style={{
        position: "absolute",
        bottom: 70,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 24,
      }}>
        {features.map((feat, i) => {
          const tagSpring = spring({ frame: frame - 80 - i * 8, fps, config: { damping: 20, stiffness: 150 } });
          const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);
          const tagY = interpolate(tagSpring, [0, 1], [20, 0]);
          return (
            <div key={i} style={{
              padding: "10px 20px",
              borderRadius: 100,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: jura,
              fontSize: 14,
              color: "rgba(250,250,249,0.7)",
              letterSpacing: "0.04em",
              opacity: tagOpacity,
              transform: `translateY(${tagY}px)`,
            }}>
              {feat}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
