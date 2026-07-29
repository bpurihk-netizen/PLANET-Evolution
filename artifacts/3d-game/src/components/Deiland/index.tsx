import React, { useRef } from 'react';
import { DeilandScene } from './DeilandScene';
import { DeilandHUD }   from './DeilandHUD';
import { SolarSystemState } from '../../hooks/useSolarSystem';

interface DeilandProps {
  state: SolarSystemState;
}

export const Deiland: React.FC<DeilandProps> = ({ state }) => {
  const joystickRef  = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraYawRef = useRef(0); // shared between scene (read) and HUD (write via swipe)
  const body = state.deilandBody;

  if (!body) return null;

  return (
    <div className="absolute inset-0 z-50 bg-[#050510]">
      {/* 3-D scene */}
      <div className="absolute inset-0">
        <DeilandScene body={body} joystickRef={joystickRef} cameraYawRef={cameraYawRef} />
      </div>
      {/* DOM overlay (joystick, exit button, camera swipe) */}
      <DeilandHUD
        planetName={body.nameJa}
        joystickRef={joystickRef}
        cameraYawRef={cameraYawRef}
        onExit={state.exitDeiland}
      />
    </div>
  );
};
