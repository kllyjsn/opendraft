import { SpaceGremlin } from "@/components/SpaceGremlin";

/**
 * A few fun animated gremlins scattered on the homepage hero.
 * Hidden on mobile to keep layout clean.
 */
export function HomepageGremlins() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Top-left: curious gremlin with jetpack */}
        <SpaceGremlin
          x={90}
          y={120}
          color="hsl(265 85% 58%)"
          scale={0.7}
          expression="curious"
          hasJetpack
          animDelay={0.2}
        />

        {/* Top-right: winking gremlin with helmet */}
        <SpaceGremlin
          x={1110}
          y={160}
          color="hsl(175 85% 45%)"
          scale={0.65}
          expression="wink"
          hasHelmet
          animDelay={0.6}
        />

        {/* Bottom-left: excited gremlin */}
        <SpaceGremlin
          x={140}
          y={550}
          color="hsl(330 85% 55%)"
          scale={0.55}
          expression="excited"
          animDelay={1.0}
        />
      </svg>
    </div>
  );
}
