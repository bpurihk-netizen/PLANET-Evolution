import React, { useState, useEffect } from 'react';
import { GameState, getPhaseInfo } from '../hooks/useGameState';
import { ParameterPanel } from './ParameterPanel';
import { Pause, Play, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPECIES_JA } from '../hooks/usePlanetParams';
import { transformations, FAILURE_TRANSFORMATIONS, EMOJI_MAP } from '../data/transformations';

export const HUD: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const p = gameState.planets[gameState.activeIndex];
  const phaseInfo = getPhaseInfo(p.time);
  const ageBillionYears = p.time * 0.1;
  const timeRemaining = Math.max(0, phaseInfo.end - p.time);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  let lifeProgress = p.stats.biomass * 100;
  let civProgress = p.stats.civLevel * 100;

  const isCrisis = p.time >= 680 && p.time < 820;
  const isCollapse = p.time >= 820 && p.failureType;

  const currentT = transformations.find(t => t.id === p.transformation) || FAILURE_TRANSFORMATIONS.find(t => t.id === p.transformation);
  const tName = currentT ? currentT.name : '未知の形態';
  const tEmoji = EMOJI_MAP[p.transformation] || '🌍';

  const nuclearTimer = p.nuclearTimer || 0;

  if (isCollapse) {
    let msg = '';
    if (p.failureType === 'venus') msg = '🔥 金星化崩壊 - 温室効果が制御不能になった';
    if (p.failureType === 'ecosystem') msg = '☠️ 生態系崩壊 - 文明の暴走が生命を滅ぼした';
    if (p.failureType === 'nuclear') msg = '☢️ 核戦争崩壊 - 誰も止めなかった。文明は自らを滅ぼした';
    if (p.failureType === 'freeze') msg = '❄️ 熱的死 - 熱エネルギーが尽き、全ての活動が永遠に止まった';
    if (p.failureType === 'gravity') msg = '🕳️ 重力崩壊 - 自らの重力に潰された';
  
    return (
      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 pointer-events-auto">
        <h2 className="text-4xl text-red-500 font-bold mb-4 animate-pulse">COLLAPSE</h2>
        <p className="text-xl text-red-200 mb-8 max-w-lg text-center leading-relaxed">{msg}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => gameState.resetPlanet(gameState.activeIndex)}
            className="px-8 py-3 bg-red-900/50 hover:bg-red-800 border border-red-500 rounded-full text-white font-bold transition-colors"
          >
            もう一度育てる
          </button>
          <button 
            onClick={() => gameState.resetAllPlanets()}
            className="px-8 py-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-500 rounded-full text-white font-bold transition-colors"
          >
            全てリセット
          </button>
        </div>
      </div>
    );
  }
  
  if (p.succeeded && !p.acknowledgedSuccess) {
    return (
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center z-50 pointer-events-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/10 to-yellow-500/30 animate-pulse mix-blend-overlay" />
        <h2 className="text-5xl text-yellow-300 font-bold mb-6 drop-shadow-[0_0_20px_rgba(253,224,71,0.8)]">✨ 惑星が安定した！ ✨</h2>
        <p className="text-2xl text-white mb-2 max-w-lg text-center leading-relaxed drop-shadow-md">
          {p.name} は成熟した惑星として継続します
        </p>
        <p className="text-xl text-green-300 mb-6 drop-shadow-md">
          🌱 {p.name}の子孫 が誕生しました！
        </p>
        <p className="text-sm text-white/70 mb-10">（惑星カードに新惑星が表示されます）</p>
        <button 
          onClick={() => gameState.dismissSuccessOverlay(gameState.activeIndex)}
          className="px-8 py-3 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-300 rounded-full text-white font-bold transition-colors z-10"
        >
          次へ
        </button>
      </div>
    );
  }

  let timeRemainingDisplay = '';
  if (p.time >= 820) {
    timeRemainingDisplay = '崩壊中';
  } else if (p.time === 819) {
    timeRemainingDisplay = '🔒 最終安定ライン確認中';
  } else {
    timeRemainingDisplay = `次のイベントまで: ${timeRemaining.toFixed(0)}s`;
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      {isCrisis && gameState.zoomLevel === 1 && (
        <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(255,0,0,0.3)] animate-pulse mix-blend-screen bg-red-500/10" />
      )}
      
      {/* Top Bar */}
      <div className="flex flex-col w-full pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold tracking-widest text-white/90">惑星育成ゲーム</h1>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-md border border-white/20 text-white/80 active:bg-white/20 transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>
        
        {/* Milestone Bar */}
        <div className="flex justify-center items-center gap-2 px-4 pb-4">
          <div className={cn("flex flex-col items-center transition-all", p.milestones.ocean ? "opacity-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "opacity-30", p.time >= 180 && p.time < 320 ? "animate-pulse" : "")}>
            <span className="text-xl">🌊</span>
            <span className="text-[10px] text-white/70 mt-1">(320s)</span>
          </div>
          <div className="h-0.5 w-8 bg-white/20 mx-1" />
          <div className={cn("flex flex-col items-center transition-all", p.milestones.life ? "opacity-100 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "opacity-30", p.time >= 320 && p.time < 500 ? "animate-pulse" : "")}>
            <span className="text-xl">🌱</span>
            <span className="text-[10px] text-white/70 mt-1">(500s)</span>
          </div>
          <div className="h-0.5 w-8 bg-white/20 mx-1" />
          <div className={cn("flex flex-col items-center transition-all", p.milestones.civilization ? "opacity-100 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "opacity-30", p.time >= 500 && p.time < 680 ? "animate-pulse" : "")}>
            <span className="text-xl">🏙️</span>
            <span className="text-[10px] text-white/70 mt-1">(680s)</span>
          </div>
          <div className="h-0.5 w-8 bg-white/20 mx-1" />
          <div className={cn("flex flex-col items-center transition-all", p.milestones.stable ? "opacity-100 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" : "opacity-30", p.time >= 680 && p.time <= 819 ? "animate-pulse" : "")}>
            <span className="text-xl">✨</span>
            <span className="text-[10px] text-white/70 mt-1">(819s)</span>
          </div>
        </div>
      </div>

      {/* CRISIS Warnings */}
      {isCrisis && (
        <div className="absolute top-24 left-4 right-4 flex flex-col gap-2 pointer-events-none z-20">
          {p.venusTimer > 50 && (
            <div className="bg-red-900/80 border border-red-500 p-2 rounded text-red-100 text-sm animate-pulse flex items-center gap-2">
              <span>⚠️</span> <span>金星化危機: あと{(90 - p.venusTimer).toFixed(0)}秒で崩壊</span>
            </div>
          )}
          {p.ecoTimer > 30 && (
             <div className="bg-yellow-900/80 border border-yellow-500 p-2 rounded text-yellow-100 text-sm animate-pulse flex items-center gap-2">
              <span>⚠️</span> <span>生態系崩壊警告: あと{(60 - p.ecoTimer).toFixed(0)}秒で崩壊</span>
            </div>
          )}
          {p.freezeTimer > 80 && (
             <div className="bg-blue-900/80 border border-blue-500 p-2 rounded text-blue-100 text-sm animate-pulse flex items-center gap-2">
              <span>⚠️</span> <span>凍結警告: あと{(120 - p.freezeTimer).toFixed(0)}秒で崩壊</span>
            </div>
          )}
          {nuclearTimer > 80 && (
             <div className="bg-gray-900/80 border border-gray-500 p-2 rounded text-gray-100 text-sm animate-pulse flex items-center gap-2">
              <span>💀</span> <span>放置警告: あと{(120 - nuclearTimer).toFixed(0)}秒で核戦争崩壊</span>
            </div>
          )}
        </div>
      )}

      {/* Center Phase Info */}
      <div className="absolute top-[40%] left-0 right-0 flex flex-col items-center pointer-events-none drop-shadow-md">
        <h2 
          key={phaseInfo.name}
          className="text-3xl font-light tracking-[0.2em] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in-95 duration-1000"
        >
          {phaseInfo.name}
        </h2>
        <div className="mt-3 text-lg font-bold text-white/90 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
          {tEmoji} {tName}
        </div>
        <div className="text-white/60 font-mono mt-2 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          {timeRemainingDisplay}
        </div>
        
        {/* 最終安定ライン確認リスト */}
        {p.time === 819 && !p.succeeded && !p.failureType && (
          <div className="mt-4 p-4 bg-black/60 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl flex flex-col gap-2 pointer-events-auto">
             <h3 className="text-amber-400 font-bold text-center mb-2 animate-pulse">🔒 最終安定ライン確認中...</h3>
             <div className="text-sm font-mono space-y-1">
               <div className="flex gap-2"><span>{p.stats.habitability > 65 ? '✅' : '❌'}</span> <span className="text-white/90">居住適性 &gt; 65% (現在: {p.stats.habitability.toFixed(0)}%)</span></div>
               <div className="flex gap-2"><span>{p.stats.biomass > 0.50 ? '✅' : '❌'}</span> <span className="text-white/90">バイオマス &gt; 50% (現在: {(p.stats.biomass * 100).toFixed(0)}%)</span></div>
               <div className="flex gap-2"><span>{p.stats.atmStability > 60 ? '✅' : '❌'}</span> <span className="text-white/90">大気安定性 &gt; 60% (現在: {p.stats.atmStability.toFixed(0)}%)</span></div>
               <div className="flex gap-2"><span>{p.stats.civLevel > 0.50 ? '✅' : '❌'}</span> <span className="text-white/90">文明レベル &gt; 50% (現在: {(p.stats.civLevel * 100).toFixed(0)}%)</span></div>
             </div>
          </div>
        )}
      </div>

      {/* Bottom Area */}
      <div className="flex flex-col gap-3 p-4 pb-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-auto mt-auto">
        
        {/* Stats Row */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex flex-col">
            <span className="text-white/50 text-xs font-mono">惑星年齢</span>
            <span className="text-2xl font-light tracking-widest text-white/90">{ageBillionYears.toFixed(1)} <span className="text-sm">億年</span></span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">居住適性</span>
              <span className={p.stats.habitability > 60 ? "text-green-400 font-mono text-base" : "text-amber-400 font-mono text-base"}>{p.stats.habitability.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">生命確率</span>
              <span className="text-white/90 font-mono text-base">{p.stats.lifeProb.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">大気安定性</span>
              <span className="text-white/90 font-mono text-base">{p.stats.atmStability.toFixed(0)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/50 text-[10px] font-mono whitespace-nowrap">重力</span>
              <span className="text-white/90 font-mono text-base">{p.stats.gravity.toFixed(2)}G</span>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-20 font-mono text-white/60 tracking-wider">生命バイオマス</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${lifeProgress}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] w-20 font-mono text-white/60 tracking-wider">文明の発展</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${civProgress}%` }} />
            </div>
          </div>
          {p.params.species !== 'None' && civProgress > 10 && (
            <div className="text-[10px] text-amber-200 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 inline-block">
              支配種族: {SPECIES_JA[p.params.species]}
            </div>
          )}
        </div>

        {/* Controls: Zoom & Speed */}
        <div className="flex gap-2">
          {/* Zoom Buttons */}
          <div className="flex flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
            {[0, 1, 2].map(z => (
              <button 
                key={z} 
                onClick={() => gameState.setZoomLevel(z as any)}
                className={cn(
                  "flex-1 h-12 flex items-center justify-center rounded-xl transition-colors text-sm font-bold", 
                  gameState.zoomLevel === z ? "bg-white/20 text-white shadow-inner" : "text-white/50 active:bg-white/10"
                )}
              >
                {z === 0 ? '宇宙' : z === 1 ? '地表' : '内部'}
              </button>
            ))}
          </div>

          {/* Speed Buttons */}
          <div className="flex flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
             <button 
                onClick={() => gameState.togglePause(gameState.activeIndex)} 
                className={cn("w-12 h-12 flex items-center justify-center rounded-xl transition-colors", p.isPaused ? "bg-amber-500/20 text-amber-200" : "text-white/50 active:bg-white/10")}
             >
               {p.isPaused ? <Play size={20} /> : <Pause size={20} />}
             </button>
             <div className="w-px h-8 bg-white/10 mx-1 self-center" />
             <div className="flex-1 flex overflow-x-auto custom-scrollbar snap-x">
               {[0.5, 1, 3, 10].map(s => (
                 <button 
                   key={s} 
                   onClick={() => gameState.setGlobalSpeed(s)}
                   className={cn("min-w-[48px] h-12 flex items-center justify-center rounded-xl text-xs font-mono transition-colors snap-center shrink-0", gameState.globalSpeed === s ? "bg-white/20 text-white shadow-inner" : "text-white/50 active:bg-white/10")}
                 >
                   x{s}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Land on Planet button */}
      {!isCollapse && gameState.shooterMode === 'off' && p.time > 180 && (
        <div className="absolute left-4 bottom-[8.5rem] pointer-events-auto">
          <button
            onClick={() => gameState.activateDeiland(gameState.activeIndex)}
            className="px-3 py-2 bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-400/60 rounded-full text-emerald-200 text-xs font-bold backdrop-blur-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            🌿 惑星に降り立つ
          </button>
        </div>
      )}

      {/* Shooter Restart Button */}
      {isCrisis && p.stats.civLevel > 0.85 && gameState.shooterMode === 'off' && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-32 pointer-events-auto">
          <button
            onClick={gameState.startShooter}
            className="px-4 py-2 bg-cyan-700/80 hover:bg-cyan-600 border border-cyan-400 rounded-full text-white text-sm font-bold animate-pulse"
          >
            🚀 宇宙侵略を再開
          </button>
        </div>
      )}

      {/* Settings Bottom Sheet */}
      <div className={cn(
        "fixed inset-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-sm transition-opacity duration-300",
        isSettingsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsSettingsOpen(false)}>
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-[#0a0a0f] border-t border-white/10 rounded-t-3xl p-6 transition-transform duration-300 max-h-[85vh] overflow-y-auto custom-scrollbar",
            isSettingsOpen ? "translate-y-0" : "translate-y-full"
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white/90">設定</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/10 rounded-full text-white/70 active:bg-white/20">
              <X size={24} />
            </button>
          </div>
          <ParameterPanel gameState={gameState} />
        </div>
      </div>
    </div>
  );
};
