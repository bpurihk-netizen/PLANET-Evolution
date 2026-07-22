import React, { useRef } from 'react';
import { DeilandScene } from './DeilandScene';
import { DeilandHUD }   from './DeilandHUD';
import { GameState }    from '../../hooks/useGameState';

interface DeilandProps {
  gameState: GameState;
}

export const Deiland: React.FC<DeilandProps> = ({ gameState }) => {
  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const planet = gameState.planets[gameState.deilandPlanetIndex];

  return (
    <div className="absolute inset-0 z-50 bg-[#050510]">
      {/* 3-D scene */}
      <div className="absolute inset-0">
        <DeilandScene planet={planet} joystickRef={joystickRef} />
      </div>
      {/* DOM overlay (joystick, exit button) */}
      <DeilandHUD
        planetName={planet.name}
        joystickRef={joystickRef}
        onExit={gameState.exitDeiland}
      />
    </div>
  );
};
