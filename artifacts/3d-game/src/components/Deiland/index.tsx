import React, { useRef, useCallback } from 'react';
import { DeilandScene } from './DeilandScene';
import { DeilandHUD }   from './DeilandHUD';
import { SolarSystemState } from '../../hooks/useSolarSystem';

interface DeilandProps {
  state: SolarSystemState;
}

export const Deiland: React.FC<DeilandProps> = ({ state }) => {
  const joystickRef    = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraYawRef   = useRef(0);     // shared between scene (read) and HUD (write via swipe)
  const cameraPitchRef = useRef(0);     // pitch offset in degrees; HUD swipe Y writes, DeilandWorld reads
  const jumpRef        = useRef(false); // HUD button sets true; scene consumes each frame
  const tapNavRef      = useRef<{ x: number; y: number } | null>(null); // HUD tap → scene raycast

  // Stable identity — deps are primitives so useCallback only recreates when body actually changes.
  // Must be declared before the early return to satisfy the rules of hooks.
  const { updateDeilandStats } = state;
  const bodyId      = state.deilandBodyId ?? '';
  const bodyNameJa  = state.deilandBody?.nameJa ?? '';
  const onStatsUpdate = useCallback(
    (civLevel: number, foodCount: number, scienceLevel: number) => {
      if (!bodyId) return;
      updateDeilandStats({ bodyId, bodyNameJa, civLevel, foodCount, scienceLevel });
    },
    [updateDeilandStats, bodyId, bodyNameJa],
  );

  const body        = state.deilandBody;
  const initialSave = bodyId ? state.deilandSaves[bodyId] : undefined;
  if (!body) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#050510]">
      {/* 3-D scene */}
      <div className="absolute inset-0">
        <DeilandScene
          body={body} joystickRef={joystickRef} cameraYawRef={cameraYawRef}
          cameraPitchRef={cameraPitchRef}
          jumpRef={jumpRef} tapNavRef={tapNavRef}
          onStatsUpdate={onStatsUpdate}
          initialSave={initialSave}
          onSaveDeiland={state.saveDeilandPlanet}
        />
      </div>
      {/* DOM overlay (joystick, exit button, camera swipe, jump button) */}
      <DeilandHUD
        planetName={body.nameJa}
        joystickRef={joystickRef}
        cameraYawRef={cameraYawRef}
        cameraPitchRef={cameraPitchRef}
        jumpRef={jumpRef}
        tapNavRef={tapNavRef}
        onExit={state.exitDeiland}
      />
    </div>
  );
};
