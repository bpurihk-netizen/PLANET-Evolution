import React from 'react';
import { GameState } from '../hooks/useGameState';

export const ParameterPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];

  const update = (key: string, val: number | string) => {
    gameState.updatePlanetParams(gameState.activeIndex, { [key]: val });
  };

  const Slider = ({ label, value, min, max, keyName, step = 1 }: any) => (
    <div className="flex flex-col gap-1 mb-3">
      <div className="flex justify-between text-xs text-white/70 font-mono">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => update(keyName, Number(e.target.value))}
        className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
      />
    </div>
  );

  return (
    <div className="w-72 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 pointer-events-auto h-fit max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl">
      <input 
        value={p.name}
        onChange={(e) => gameState.updatePlanetName(gameState.activeIndex, e.target.value)}
        className="bg-transparent text-xl font-bold text-white/90 w-full outline-none mb-1 border-b border-transparent focus:border-white/30 transition-colors"
      />
      <div className="text-xs text-white/50 mb-4 font-mono uppercase tracking-widest">{p.type}</div>
      
      <Slider label="Temperature" value={p.params.temperature} min={0} max={100} keyName="temperature" />
      <Slider label="Water Amount" value={p.params.waterAmount} min={0} max={100} keyName="waterAmount" />
      <Slider label="Nitrogen %" value={p.params.nitrogen} min={0} max={80} keyName="nitrogen" />
      <Slider label="Oxygen %" value={p.params.oxygen} min={0} max={40} keyName="oxygen" />
      <Slider label="CO2 %" value={p.params.co2} min={0} max={80} keyName="co2" />
      <Slider label="Distance" value={p.params.distance} min={0} max={100} keyName="distance" />
      <Slider label="Size" value={p.params.size} min={0} max={100} keyName="size" />
      <Slider label="Evo Speed" value={p.params.formationSpeed} min={0.5} max={10} step={0.5} keyName="formationSpeed" />
      
      <div className="flex flex-col gap-1 mb-3">
        <span className="text-xs text-white/70 font-mono">Dominant Species</span>
        <select 
          value={p.params.species}
          onChange={(e) => update('species', e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-xs p-1.5 rounded font-mono outline-none focus:border-white/50 transition-colors"
        >
          {['Aquatic', 'Plant', 'Insect', 'Mammal', 'Crystal', 'Machine', 'None'].map(s => (
            <option key={s} value={s} className="bg-[#030014] text-white">{s}</option>
          ))}
        </select>
      </div>
      
      <button 
        onClick={() => gameState.resetPlanet(gameState.activeIndex)}
        className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-300 text-xs font-mono rounded border border-red-500/30 transition-colors"
      >
        RESET PARAMETERS
      </button>
    </div>
  );
};
