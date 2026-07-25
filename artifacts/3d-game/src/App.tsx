import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useSolarSystem } from './hooks/useSolarSystem';
import { SolarSystemView } from './components/SolarSystemView';
import { ExplorerHUD } from './components/ExplorerHUD';
import { InfoPanel } from './components/InfoPanel';
import { Deiland } from './components/Deiland';
import { SpaceShooter } from './components/SpaceShooter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function SolarExplorerApp() {
  const state = useSolarSystem();

  return (
    <div className="w-full h-[100dvh] overflow-hidden relative bg-[#020408]">

      {/* ── Deiland surface mode — full replacement (frees WebGL context) ── */}
      {state.deilandMode ? (
        <Deiland state={state} />
      ) : (
        <>
          {/* ── Main 3D solar system canvas ── */}
          <div className="absolute inset-0 z-0">
            <SolarSystemView state={state} />
          </div>

          {/* ── Navigation HUD (top bar, breadcrumbs, exploration counter) ── */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <ExplorerHUD state={state} />
          </div>

          {/* ── Educational info panel (slides up from bottom when body selected) ── */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <InfoPanel state={state} />
          </div>

          {/* ── SpaceShooter overlay ── */}
          {state.shooterMode !== 'off' && (
            <div className="absolute inset-0 z-30">
              <SpaceShooter state={state} />
            </div>
          )}
        </>
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
