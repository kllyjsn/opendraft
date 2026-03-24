import { AbsoluteFill, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Jobs } from "./scenes/Scene4Jobs";
import { Scene5CTA } from "./scenes/Scene5CTA";
import { PersistentBackground } from "./components/PersistentBackground";

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#09080E" }}>
      <PersistentBackground />

      <TransitionSeries>
        {/* Scene 1: Hook - "You deserve more" */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* Scene 2: The Problem - SaaS trap */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene2Problem />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />

        {/* Scene 3: The Solution - Own your tools */}
        <TransitionSeries.Sequence durationInFrames={160}>
          <Scene3Solution />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* Scene 4: Career transformation */}
        <TransitionSeries.Sequence durationInFrames={170}>
          <Scene4Jobs />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        {/* Scene 5: CTA - Start building */}
        <TransitionSeries.Sequence durationInFrames={165}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
