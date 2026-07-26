import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSolarSystem } from './hooks/useSolarSystem';
import { useStampRally } from './hooks/useStampRally';
import { SolarSystemView } from './components/SolarSystemView';
import { ExplorerHUD } from './components/ExplorerHUD';
import { InfoPanel } from './components/InfoPanel';
import { Deiland } from './components/Deiland';
import { SpaceShooter } from './components/SpaceShooter';
import { ConstellationGlobe } from './components/ConstellationGlobe';
import { ConstellationEncyclopedia } from './components/ConstellationEncyclopedia';
import { NightSkyGuide } from './components/NightSkyGuide';
import { WarpOverlay } from './components/WarpOverlay';
import { StampRallyBook } from './components/StampRallyBook';
import {
  BODY_STAMP_TRIGGERS,
  SYSTEM_STAMP_TRIGGERS,
  SOLAR_MAIN_PLANET_IDS,
  ZODIAC_STAMP_IDS,
} from './data/stampData';
import { CONSTELLATIONS } from './data/constellations';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// Toast notification for newly earned stamps
function StampToast({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const names = ids
    .map(id => CONSTELLATIONS.find(c => c.id === id)?.nameJa ?? id)
    .join('・');

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 bg-amber-500/95 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center gap-2 max-w-xs w-auto animate-bounce-in pointer-events-none">
      <span className="text-xl shrink-0">🎫</span>
      <div>
        <p className="text-amber-950 font-black text-sm leading-tight">スタンプゲット！</p>
        <p className="text-amber-900 text-xs">{names}</p>
      </div>
    </div>
  );
}

function SolarExplorerApp() {
  const state = useSolarSystem();
  const stampRally = useStampRally();
  const [showStampBook, setShowStampBook] = useState(false);
  const [toastIds, setToastIds] = useState<string[]>([]);
  const prevVisitedRef = useRef<string[]>([]);
  const prevSystemRef = useRef<string>(state.currentSystemId);

  // Helper: award stamps and show toast for newly earned ones
  const awardAndToast = useCallback((ids: string[]) => {
    // Flatten all stamp IDs to award
    const allIds = ids.flatMap(id => {
      // filter to only valid constellation IDs
      return CONSTELLATIONS.some(c => c.id === id) ? [id] : [];
    });
    if (allIds.length === 0) return;
    const newlyEarned = stampRally.awardStamps(allIds);
    if (newlyEarned.length > 0) {
      setToastIds(newlyEarned);
    }
  }, [stampRally]);

  // Watch visitedBodyIds for body-based stamp triggers
  useEffect(() => {
    const prev = new Set(prevVisitedRef.current);
    const curr = state.visitedBodyIds;
    const newVisits = curr.filter(id => !prev.has(id));
    prevVisitedRef.current = curr;

    if (newVisits.length === 0) return;

    // Award body-level stamps
    const toAward: string[] = [];
    for (const bodyId of newVisits) {
      const stamps = BODY_STAMP_TRIGGERS[bodyId] ?? [];
      toAward.push(...stamps);
    }

    // Check if all solar system main planets visited → award all zodiac stamps
    const allMainVisited = SOLAR_MAIN_PLANET_IDS.every(id => state.visitedBodyIds.includes(id));
    if (allMainVisited) {
      toAward.push(...ZODIAC_STAMP_IDS);
    }

    if (toAward.length > 0) {
      awardAndToast(toAward);
    }
  }, [state.visitedBodyIds, awardAndToast]);

  // Watch currentSystemId for system-arrival stamp triggers
  useEffect(() => {
    if (state.currentSystemId === prevSystemRef.current) return;
    prevSystemRef.current = state.currentSystemId;

    const stamps = SYSTEM_STAMP_TRIGGERS[state.currentSystemId] ?? [];
    if (stamps.length > 0) {
      awardAndToast(stamps);
    }
  }, [state.currentSystemId, awardAndToast]);

  // Handle quiz-earned stamp
  const handleStampEarned = useCallback((constellationId: string) => {
    awardAndToast([constellationId]);
  }, [awardAndToast]);

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative bg-[#020408]">

      {/* ── Night sky guide mode — full replacement ── */}
      {state.nightSkyMode ? (
        <NightSkyGuide
          onExit={state.exitNightSky}
          onOpenEncyclopedia={() => { state.exitNightSky(); state.enterEncyclopedia(); }}
          onSwitchSystem={(id) => { state.exitNightSky(); state.switchSystem(id); }}
        />
      ) : state.encyclopediaMode ? (
        <ConstellationEncyclopedia
          onExit={state.exitEncyclopedia}
          onSwitchSystem={(id) => { state.exitEncyclopedia(); state.switchSystem(id); }}
          onConstellationViewed={(id) => awardAndToast([id])}
        />
      ) : state.globeMode ? (
        /* ── Constellation globe mode — full replacement ── */
        <ConstellationGlobe
          onExit={state.exitGlobe}
          onSwitchSystem={(id) => { state.exitGlobe(); state.switchSystem(id); }}
          onConstellationViewed={(id) => awardAndToast([id])}
        />
      ) : state.deilandMode ? (
        /* ── Deiland surface mode — full replacement (frees WebGL context) ── */
        <Deiland state={state} />
      ) : (
        <>
          {/* ── Main 3D solar system canvas ── */}
          <div className="absolute inset-0 z-0">
            <SolarSystemView state={state} />
          </div>

          {/* ── Navigation HUD (top bar, breadcrumbs, exploration counter) ── */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <ExplorerHUD
              state={state}
              stampRally={stampRally}
              onOpenStampBook={() => setShowStampBook(true)}
            />
          </div>

          {/* ── Educational info panel (slides up from bottom when body selected) ── */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <InfoPanel
              state={state}
              stampRally={stampRally}
              onStampEarned={handleStampEarned}
            />
          </div>

          {/* ── SpaceShooter overlay ── */}
          {state.shooterMode !== 'off' && (
            <div className="absolute inset-0 z-30">
              <SpaceShooter state={state} />
            </div>
          )}

          {/* ── Warp animation overlay ── */}
          <WarpOverlay
            isActive={state.isWarping}
            destinationName={state.warpTarget?.nameJa ?? ''}
            distanceLy={state.warpTarget?.distanceLy ?? 0}
            onComplete={state.completeWarp}
          />
        </>
      )}

      {/* ── Stamp Book modal (global, above everything) ── */}
      {showStampBook && (
        <StampRallyBook
          stampRally={stampRally}
          onClose={() => setShowStampBook(false)}
        />
      )}

      {/* ── Stamp earned toast ── */}
      {toastIds.length > 0 && (
        <StampToast ids={toastIds} onDone={() => setToastIds([])} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/" component={SolarExplorerApp} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
