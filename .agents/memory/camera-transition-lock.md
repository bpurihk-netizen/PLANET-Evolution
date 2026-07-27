---
name: CameraController transition lock (overview rotation blocked)
description: Why overview rotation sometimes fails and how to fix it
---

## Rule
In `CameraController` (SolarSystemView.tsx), always add a `transitionFrames` ref and force `transitioning.current = false` after ~90 frames, regardless of distance.

## Why
When switching to overview, both `CameraController` and `OrbitControls` are active simultaneously. If OrbitControls moves the camera away from `targetCamPos`, `camera.position.distanceTo(targetCamPos)` never reaches < 0.5 — the transition never ends, permanently blocking `OrbitControls` rotation (since the lerp keeps overwriting the camera each frame).

## How to apply
```ts
const transitionFrames = useRef(0);
// Reset in both useEffects that set transitioning.current = true
transitionFrames.current = 0;
// In useFrame:
transitionFrames.current++;
if (distance < 0.5 || transitionFrames.current > 90) {
  transitioning.current = false;
  transitionFrames.current = 0;
}
```
