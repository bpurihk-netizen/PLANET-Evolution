import React from 'react';
import { GameState } from '../hooks/useGameState';
import { PLANET_TYPE_JA, SPECIES_JA } from '../hooks/usePlanetParams';

export const ParameterPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];

  const update = (key: string, val: number | string) => {
    gameState.updatePlanetParams(gameState.activeIndex, { [key]: val });
  };

  const Slider = ({ label, value, min, max, keyName, step = 1 }: any) => (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between text-sm text-white/70 font-mono">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-8 flex items-center">
        <input 
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => update(keyName, Number(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer touch-none"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full pointer-events-auto pb-8">
      <input 
        value={p.name}
        onChange={(e) => gameState.updatePlanetName(gameState.activeIndex, e.target.value)}
        className="bg-transparent text-2xl font-bold text-white/90 w-full outline-none mb-2 border-b border-transparent focus:border-white/30 transition-colors"
      />
      <div className="text-sm text-white/50 mb-6 font-mono tracking-widest">{PLANET_TYPE_JA[p.type] || p.type}</div>
      
      <Slider label="温度 (Temperature)" value={p.params.temperature} min={0} max={100} keyName="temperature" />
      <Slider label="水の量 (Water Amount)" value={p.params.waterAmount} min={0} max={100} keyName="waterAmount" />
      <Slider label="窒素% (Nitrogen)" value={p.params.nitrogen} min={0} max={80} keyName="nitrogen" />
      <Slider label="酸素% (Oxygen)" value={p.params.oxygen} min={0} max={40} keyName="oxygen" />
      <Slider label="二酸化炭素% (CO2)" value={p.params.co2} min={0} max={80} keyName="co2" />
      <Slider label="恒星からの距離 (Distance)" value={p.params.distance} min={0} max={100} keyName="distance" />
      <Slider label="惑星の大きさ (Size)" value={p.params.size} min={0} max={100} keyName="size" />
      <Slider label="進化速度 (Evo Speed)" value={p.params.formationSpeed} min={0.5} max={10} step={0.5} keyName="formationSpeed" />
      
      <div className="flex flex-col gap-2 mb-6">
        <span className="text-sm text-white/70 font-mono">支配種族 (Dominant Species)</span>
        <select 
          value={p.params.species}
          onChange={(e) => update('species', e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-base p-3 rounded-xl outline-none focus:border-white/50 transition-colors h-12"
        >
          {['None', 'Aquatic', 'Plant', 'Insect', 'Mammal', 'Crystal', 'Machine'].map(s => (
            <option key={s} value={s} className="bg-[#030014] text-white">{SPECIES_JA[s as keyof typeof SPECIES_JA] || s}</option>
          ))}
        </select>
      </div>
      
      <button 
        onClick={() => gameState.resetPlanet(gameState.activeIndex)}
        className="w-full mt-2 py-4 h-14 flex items-center justify-center bg-red-500/10 active:bg-red-500/30 text-red-300 text-sm font-bold rounded-xl border border-red-500/30 transition-colors"
      >
        パラメーターをリセット
      </button>
    </div>
  );
};
