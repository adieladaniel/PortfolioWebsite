import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSceneStore } from '@/store/sceneStore';
import { spineCurve } from './CurveSpline';
import { clamp01 } from '@/utils/math';
import { findMilestoneAtProgress } from '@/data/timeline';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/** Higher = camera catches up to scroll target faster (less trailing lag). */
const DAMP_FACTOR = 4;
/** How far ahead on the curve the camera looks by default, as a fraction of total progress. */
const LOOK_AHEAD = 0.02;

const overridePoint = new Vector3();
const aheadPoint = new Vector3();
const blendedPoint = new Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const currentProgress = useRef(0);
  const lookTarget = useRef(new Vector3());
  const lookInitialized = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        useSceneStore.getState().setTargetProgress(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  useFrame((_, delta) => {
    const target = useSceneStore.getState().targetProgress;
    if (prefersReducedMotion.current) {
      // instant cuts, no continuous travel — the motion itself (not just
      // easing) is what prefers-reduced-motion asks us to avoid
      currentProgress.current = target;
    } else {
      currentProgress.current = MathUtils.damp(currentProgress.current, target, DAMP_FACTOR, delta);
    }
    const progress = clamp01(currentProgress.current);
    useSceneStore.getState().setProgress(progress);

    const position = spineCurve.getPointAt(progress);
    camera.position.copy(position);

    aheadPoint.copy(spineCurve.getPointAt(clamp01(progress + LOOK_AHEAD)));

    const milestone = findMilestoneAtProgress(progress);
    let desiredLook = aheadPoint;
    if (milestone?.lookAtOverride) {
      const [start, end] = milestone.scrollRange;
      const center = (start + end) / 2;
      const halfSpan = (end - start) / 2 || 0.001;
      // smoothstepped triangular weight: 1 at the milestone's center, 0 at
      // its edges, eased rather than linear so the look-at swing doesn't
      // change direction with a mechanical, constant-rate snap
      const triangular = clamp01(1 - Math.abs(progress - center) / halfSpan);
      const weight = triangular * triangular * (3 - 2 * triangular);
      overridePoint.set(milestone.lookAtOverride.x, milestone.lookAtOverride.y, milestone.lookAtOverride.z);
      desiredLook = blendedPoint.copy(aheadPoint).lerp(overridePoint, weight);
    }

    if (!lookInitialized.current || prefersReducedMotion.current) {
      lookTarget.current.copy(desiredLook);
      lookInitialized.current = true;
    } else {
      lookTarget.current.lerp(desiredLook, 0.15);
    }
    camera.lookAt(lookTarget.current);
  });

  return null;
}
