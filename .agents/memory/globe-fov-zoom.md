---
name: Globe inside-sphere FOV zoom
description: Why and how to implement zoom for a camera that lives inside a celestial sphere
---

## Rule
When the camera is positioned *inside* a large sphere (e.g., ConstellationGlobe at `[0,0,0.1]` inside sphere of radius 32), OrbitControls dolly changes camera-to-origin distance, which produces no perceptible visual effect. Use FOV-based zoom instead.

## How to apply
1. Add `GlobeFovZoom` R3F component inside Canvas — listens for `touchmove` (two-finger pinch) and `wheel` events on `gl.domElement`, adjusts `(camera as THREE.PerspectiveCamera).fov` clamped to `[12, 90]`, calls `cam.updateProjectionMatrix()`.
2. Set `enableZoom={false}` on OrbitControls (remove `zoomSpeed` prop too).
3. Keep `touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}` — OrbitControls handles rotation from both 1 and 2 fingers; GlobeFovZoom handles FOV from 2-finger pinch (both fire simultaneously, which is correct UX).
4. Import `useThree` from `@react-three/fiber` and `useEffect` from React for the component.

**Why:** Distance-based zoom is meaningless from inside a sphere. FOV zoom ("telephoto" effect) gives the expected zoom-in/out behaviour.
