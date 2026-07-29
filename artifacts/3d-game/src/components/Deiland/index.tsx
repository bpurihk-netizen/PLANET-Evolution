import React, { useRef } from 'react';
import { DeilandScene } from './DeilandScene';
import { DeilandHUD }   from './DeilandHUD';
import { SolarSystemState } from '../../hooks/useSolarSystem';

interface DeilandProps {
  state: SolarSystemState;
}

export const Deiland: React.FC<DeilandProps> = ({ state }) => {
  const joystickRef  = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraYawRef = useRef(0);     // shared between scene (read) and HUD (write via swipe)
  const jumpRef      = useRef(false); // HUD button sets true; scene consumes each frame
  const tapNavRef    = useRef<{ x: number; y: number } | null>(null); // HUD tap → scene raycast
  const body = state.deilandBody;

  if (!body) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#050510]">
      {/* 3-D scene */}
      <div className="absolute inset-0">
        <DeilandScene body={body} joystickRef={joystickRef} cameraYawRef={cameraYawRef} jumpRef={jumpRef} tapNavRef={tapNavRef} />
      </div>
      {/* DOM overlay (joystick, exit button, camera swipe, jump button) */}
      <DeilandHUD
        planetName={body.nameJa}
        joystickRef={joystickRef}
        cameraYawRef={cameraYawRef}
        jumpRef={jumpRef}
        tapNavRef={tapNavRef}
        onExit={state.exitDeiland}
      />
    </div>
  );
};
