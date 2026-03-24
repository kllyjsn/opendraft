import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const PersistentBackground = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Slow drifting gradient across the entire video
  const hue = interpolate(frame, [0, durationInFrames], [240, 260]);
  const yShift = interpolate(frame, [0, durationInFrames], [0, -120]);

  return (
    <AbsoluteFill>
      {/* Base dark */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(170deg, #09080E 0%, #0D0B18 40%, #110E1F 100%)`,
      }} />

      {/* Floating orb - subtle */}
      <div style={{
        position: "absolute",
        width: 800, height: 800,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(232,56,13,0.06) 0%, transparent 70%)`,
        top: 200 + yShift,
        right: -200,
        filter: "blur(80px)",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: 0.025,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Ascending lines - voltage traces */}
      {[0, 1, 2].map((i) => {
        const lineY = interpolate(frame, [0, durationInFrames], [900 - i * 200, 100 - i * 200]);
        const lineOpacity = interpolate(frame,
          [i * 80, i * 80 + 60, durationInFrames - 60, durationInFrames],
          [0, 0.08, 0.08, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div key={i} style={{
            position: "absolute",
            left: 0, right: 0,
            top: lineY,
            height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(232,56,13,${lineOpacity}) 30%, rgba(232,56,13,${lineOpacity}) 70%, transparent 100%)`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};
