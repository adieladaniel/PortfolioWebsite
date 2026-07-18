// Camera FOV is 60 (App.tsx), so at a given forward distance D from the
// camera, a building needs roughly LATERAL_OFFSET / D below ~0.6 to stay
// comfortably inside the horizontal frustum rather than clipped at the
// screen edge. Tuned together with FORWARD_BIAS_Z below — see its comment
// for why D can't just be "however far the building happens to be".
export const LATERAL_OFFSET = 3.6;
export const GROUND_DROP = 1.6;

// A building's ground Z used to equal its own milestone's anchor.z exactly —
// but the camera is *also* at (or very near) that same Z when the milestone
// is most active (progress == group.center, card fully shown, swarm fully
// assembled), which puts the building almost directly to the camera's side,
// near/outside the view frustum, right when it's supposed to be most
// visible ("card in view but no building anywhere on screen", reported
// 2026-07-18). No amount of LATERAL_OFFSET fixes that on its own — pushing
// sideways from a point already beside the camera just moves it further out
// of frame; increasing this forward distance is what actually keeps it in
// frustum. Pulling the ground point forward (more negative Z, in the
// direction of travel) means the building is still *ahead* of the camera —
// comfortably in the forward view, off to one side — for the whole time its
// card is on screen, and only swings beside/behind the camera as the next
// milestone's card takes over. Roughly 1.3x the ~4.5-unit inter-milestone
// anchor spacing.
export const FORWARD_BIAS_Z = 6;
