import React, { useState } from 'react';
import { GameState } from '../hooks/useGameState';
import { PLANET_TYPE_JA, SPECIES_JA } from '../hooks/usePlanetParams';
import { transformations, FAILURE_TRANSFORMATIONS, EMOJI_MAP } from '../data/transformations';

const Section: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl mb-4 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center text-white/90 font-bold hover:bg-white/10 transition-colors"
      >
        <span>{title}</span>
        <span className="text-xs text-white/50">{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-white/10 flex flex-col gap-4 bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
};

export const ParameterPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];

  const update = (key: string, val: number | string) => {
    gameState.updatePlanetParams(gameState.activeIndex, { [key]: val });
  };

  const currentT = transformations.find(t => t.id === p.transformation) || FAILURE_TRANSFORMATIONS.find(t => t.id === p.transformation);
  const tEmoji = EMOJI_MAP[p.transformation] || '🌍';

  const Slider = ({ label, value, min, max, keyName, step = 1 }: any) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm text-white/70 font-mono">
        <span>{label}</span>
        <span className="text-white/90">{value}</span>
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
      <div className="text-sm text-white/50 mb-4 font-mono tracking-widest">{PLANET_TYPE_JA[p.type] || p.type}</div>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="text-lg font-bold text-white/90 mb-1">{tEmoji} {currentT?.name}</div>
        <div className="text-sm text-white/70 leading-relaxed">{currentT?.description}</div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <Slider label="温度 (Temperature)" value={p.params.temperature} min={-100} max={100} keyName="temperature" />
        <Slider label="水の量 (Water Amount)" value={p.params.waterAmount} min={0} max={100} keyName="waterAmount" />
        <Slider label="窒素% (Nitrogen)" value={p.params.nitrogen} min={0} max={100} keyName="nitrogen" />
        <Slider label="酸素% (Oxygen)" value={p.params.oxygen} min={0} max={100} keyName="oxygen" />
        <Slider label="二酸化炭素% (CO2)" value={p.params.co2} min={0} max={100} keyName="co2" />
        <Slider label="恒星からの距離 (Distance)" value={p.params.distance} min={0} max={100} keyName="distance" />
        <Slider label="惑星の大きさ (Size)" value={p.params.size} min={0} max={100} keyName="size" />
        <Slider label="進化速度 (Evo Speed)" value={p.params.formationSpeed} min={0.5} max={10} step={0.5} keyName="formationSpeed" />
        
        <div className="flex flex-col gap-2 mt-2">
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
      </div>

      <Section title="🌋 地質・内核">
        <Slider label="地殻活動指数" value={p.params.tectonicActivity} min={0} max={100} keyName="tectonicActivity" />
        <Slider label="内核の回転速度" value={p.params.coreRotationSpeed} min={0} max={100} keyName="coreRotationSpeed" />
        <Slider label="金属核の比率" value={p.params.metallicCoreRatio} min={0} max={100} keyName="metallicCoreRatio" />
        <Slider label="マントルの粘性" value={p.params.mantleViscosity} min={0} max={100} keyName="mantleViscosity" />
        <Slider label="初期揮発性物質量" value={p.params.initialVolatiles} min={0} max={100} keyName="initialVolatiles" />
      </Section>

      <Section title="🪐 宇宙環境・軌道">
        <Slider label="軌道離心率" value={p.params.orbitalEccentricity} min={0} max={100} keyName="orbitalEccentricity" />
        <Slider label="自転軸の傾き" value={p.params.axialTilt} min={0} max={90} step={1} keyName="axialTilt" />
        <Slider label="連星系の影響" value={p.params.binaryStarInfluence} min={0} max={100} keyName="binaryStarInfluence" />
        <Slider label="衛星の数" value={p.params.satelliteCount} min={0} max={5} step={1} keyName="satelliteCount" />
        <Slider label="小惑星帯の密度" value={p.params.asteroidBeltDensity} min={0} max={100} keyName="asteroidBeltDensity" />
      </Section>

      <Section title="🌊 大気・海洋組成">
        <Slider label="メタン濃度" value={p.params.methaneConcentration} min={0} max={100} keyName="methaneConcentration" />
        <Slider label="オゾン層の厚さ" value={p.params.ozoneLayerThickness} min={0} max={100} keyName="ozoneLayerThickness" />
        <Slider label="硫黄化合物濃度" value={p.params.sulfurCompounds} min={0} max={100} keyName="sulfurCompounds" />
        <Slider label="海洋の塩分濃度" value={p.params.oceanSalinity} min={0} max={100} keyName="oceanSalinity" />
        <Slider label="雲のアルベド" value={p.params.cloudAlbedo} min={0} max={100} keyName="cloudAlbedo" />
      </Section>

      <Section title="🧠 文明・生態系">
        <Slider label="平均知的指数" value={p.params.averageIntelligence} min={0} max={100} keyName="averageIntelligence" />
        <Slider label="社会システム指向" value={p.params.societalOrientation} min={0} max={100} keyName="societalOrientation" />
        <Slider label="バイオームの多様性" value={p.params.biomeDiversity} min={0} max={100} keyName="biomeDiversity" />
        <Slider label="エネルギー利用効率" value={p.params.energyEfficiency} min={0} max={100} keyName="energyEfficiency" />
        <Slider label="精神性・文化度" value={p.params.spiritualityCulture} min={0} max={100} keyName="spiritualityCulture" />
      </Section>
      
      <button 
        onClick={() => gameState.resetPlanet(gameState.activeIndex)}
        className="w-full mt-2 py-4 h-14 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-300 text-sm font-bold rounded-xl border border-red-500/30 transition-colors"
      >
        パラメーターをリセット（ランダム崩壊）
      </button>
    </div>
  );
};
