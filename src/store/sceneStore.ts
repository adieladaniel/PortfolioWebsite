import { create } from 'zustand';

interface SceneStore {
  /** 0..1 scroll progress written by GSAP ScrollTrigger, read per-frame by the camera rig. */
  targetProgress: number;
  setTargetProgress: (progress: number) => void;
  /** Damped/eased progress the camera has actually reached this frame — read by 3D objects for proximity effects. */
  progress: number;
  setProgress: (progress: number) => void;
  /** Cross-highlight between the 3D coding-stats cluster and its DOM legend — event-driven, not per-frame. */
  hoveredTopicId: string | null;
  setHoveredTopicId: (id: string | null) => void;
  /** Cross-highlight between a 3D ProjectObject and its DOM detail card — event-driven, not per-frame. */
  hoveredProjectId: string | null;
  setHoveredProjectId: (id: string | null) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  targetProgress: 0,
  setTargetProgress: (progress) => set({ targetProgress: progress }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  hoveredTopicId: null,
  setHoveredTopicId: (hoveredTopicId) => set({ hoveredTopicId }),
  hoveredProjectId: null,
  setHoveredProjectId: (hoveredProjectId) => set({ hoveredProjectId }),
}));
