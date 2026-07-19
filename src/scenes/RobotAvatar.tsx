import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, LoopOnce, MathUtils, type AnimationAction, type Object3D } from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MODEL_URL = '/models/RobotExpressive.glb';

// Occasional idle gestures — randomly chosen, randomly spaced — so the
// figure otherwise stays still and reads the cursor-tracking as the primary
// motion, per Adiel's ask for "still but has indirect movement (like eye
// blinking or hand waving sometimes)" rather than continuous motion.
const IDLE_GESTURES = ['Wave', 'Yes', 'ThumbsUp'] as const;
const GESTURE_MIN_DELAY_MS = 12000;
const GESTURE_MAX_DELAY_MS = 25000;

/** Freezes an action's pose at its current frame — `.play()` always sets `paused = false`, so this must run *after* any `.play()`/`.fadeIn()` call, not before. Weight crossfades still animate normally; only time stops advancing. */
function holdPose(action: AnimationAction) {
  action.paused = true;
}

/**
 * Hero centerpiece. `RobotExpressive.glb` — CC0 1.0, model by Tomás Laulhé
 * (three.js's own official example assets, three.js/examples/models/gltf/
 * RobotExpressive), modifications by Don McCurdy. Not attribution-required
 * under CC0, credited here anyway as a courtesy. Picked over authoring a
 * custom rigged character (not something buildable from scratch as code)
 * and it comes with a full named animation clip library already authored —
 * no custom rigging/animation work needed, just orchestrating existing
 * clips.
 *
 * The resting pose is *frozen*, not looped — `actions.Standing` (and later
 * `Sitting`) are paused at frame 0 right after being faded in, rather than
 * left playing. First attempt just played "Standing" on a loop assuming the
 * name meant "static pose," but it isn't: like most rigged-character idle
 * clips it has its own authored weight-shift/knee motion baked in, so
 * looping it still reads as continuous, slightly restless movement —
 * reported as "bending legs up and down." Freezing the action's time
 * (holdPose) sidesteps that entirely regardless of what the clip itself
 * contains: the only body motion left is the deliberate one-shot gestures
 * and the cursor-tracked head. Plays a one-shot "Wave" greeting on mount
 * (fits "Hello! I'm ___" copy next to it), settles into frozen Standing,
 * then randomly plays a short gesture (wave/nod/thumbs-up) every 12-25s
 * before freezing again. Crossfades to a frozen "Sitting" pose once the
 * About Me copy scrolls into view — the same "character transitions into a
 * new pose as you scroll" beat the reference site uses, done with a plain
 * IntersectionObserver on the `#hero-stage` DOM node rather than a
 * page-wide camera rig, since the 3D scene here is scoped to just this
 * section. The head also subtly tracks the cursor the whole time (see the
 * useFrame below).
 */
export function RobotAvatar() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const prefersReducedMotion = useReducedMotion();
  const hasGreeted = useRef(false);
  const hasSatDown = useRef(false);
  const headRef = useRef<Object3D | null>(null);

  useEffect(() => {
    headRef.current = scene.getObjectByName('Head') ?? null;
  }, [scene]);

  useEffect(() => {
    // Guards the greeting sequence with a ref, not just the effect's own
    // dependency array — `actions`/`mixer` re-running this effect (e.g. a
    // React StrictMode double-invoke in dev) must never replay "Wave" or
    // restart "Standing" from scratch a second time.
    if (!actions.Standing || hasGreeted.current) return;
    hasGreeted.current = true;

    if (prefersReducedMotion.current) {
      actions.Standing.reset().play();
      holdPose(actions.Standing);
      return;
    }

    const wave = actions.Wave;
    if (!wave) {
      actions.Standing.reset().play();
      holdPose(actions.Standing);
      return;
    }

    wave.reset();
    wave.setLoop(LoopOnce, 1);
    wave.clampWhenFinished = true;
    wave.play();

    const handleFinished = (event: { action: unknown }) => {
      if (event.action !== wave) return; // mixer's 'finished' fires for any LoopOnce action, not just this one
      wave.fadeOut(0.4);
      const standing = actions.Standing;
      if (standing) {
        standing.reset().fadeIn(0.4).play();
        holdPose(standing);
      }
      mixer.removeEventListener('finished', handleFinished);
    };
    mixer.addEventListener('finished', handleFinished);

    return () => {
      mixer.removeEventListener('finished', handleFinished);
      wave.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, mixer]);

  // Occasional idle gestures while standing (stops once it's sat down —
  // that's its own settled pose, not something to interrupt with a wave).
  useEffect(() => {
    if (prefersReducedMotion.current) return;
    const standing = actions.Standing;
    if (!standing) return;

    let timeoutId: number;
    let activeGesture: AnimationAction | null = null;

    const scheduleNext = () => {
      const delay = GESTURE_MIN_DELAY_MS + Math.random() * (GESTURE_MAX_DELAY_MS - GESTURE_MIN_DELAY_MS);
      timeoutId = window.setTimeout(() => {
        if (hasSatDown.current) return;
        const name = IDLE_GESTURES[Math.floor(Math.random() * IDLE_GESTURES.length)];
        const gesture = name ? actions[name] : undefined;
        if (gesture) {
          activeGesture = gesture;
          gesture.reset();
          gesture.setLoop(LoopOnce, 1);
          gesture.clampWhenFinished = true;
          standing.fadeOut(0.4);
          gesture.fadeIn(0.4).play(); // plays out naturally — not frozen, this one clip is meant to move

          const handleFinished = (event: { action: unknown }) => {
            if (event.action !== gesture) return;
            gesture.fadeOut(0.4);
            standing.reset().fadeIn(0.4).play();
            holdPose(standing);
            activeGesture = null;
            mixer.removeEventListener('finished', handleFinished);
          };
          mixer.addEventListener('finished', handleFinished);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      window.clearTimeout(timeoutId);
      activeGesture?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, mixer]);

  useEffect(() => {
    if (prefersReducedMotion.current) return;
    // Watches the canvas's own wrapper, not the About text below — that text
    // sits well past one viewport of scroll, so by the time it crossed an
    // "in view" threshold the avatar had already scrolled off-screen and the
    // pose change happened invisibly. Firing as the avatar itself crosses
    // 50% visibility means the transition plays while it's still on screen.
    const target = document.getElementById('hero-stage');
    const standing = actions.Standing;
    const sitting = actions.Sitting;
    if (!target || !standing || !sitting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || hasSatDown.current) return;
        if (entry.intersectionRatio <= 0.5) {
          hasSatDown.current = true;
          standing.fadeOut(0.6);
          sitting.reset().fadeIn(0.6).play();
          holdPose(sitting);
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);

  // Subtle head tracking. Deliberately *sets* (lerps toward) an absolute
  // rotation each frame rather than adding a damped offset on top of
  // whatever the mixer left there — the first version did `rotation.y +=
  // offset` on the assumption the mixer overwrites the head's rotation
  // fully every frame, but the animation clips don't animate this bone's
  // yaw at all, so nothing ever reset it: the offset accumulated by ~60
  // additions per second and spun the head almost all the way around
  // within a second. Lerping the actual value toward a bounded target is
  // stable regardless of whether the current clip touches these axes.
  useFrame((state) => {
    const head = headRef.current;
    if (!head || prefersReducedMotion.current) return;

    const targetYaw = MathUtils.clamp(state.pointer.x, -1, 1) * 0.35;
    const targetPitch = MathUtils.clamp(-state.pointer.y, -1, 1) * 0.2;
    head.rotation.y = MathUtils.lerp(head.rotation.y, targetYaw, 0.06);
    head.rotation.x = MathUtils.lerp(head.rotation.x, targetPitch, 0.06);
  });

  return <primitive ref={group} object={scene} scale={1.15} position={[0, -2.9, 0]} />;
}

useGLTF.preload(MODEL_URL);
