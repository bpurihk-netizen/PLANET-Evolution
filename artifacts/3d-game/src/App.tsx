import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useGameState } from './hooks/useGameState';
import { PlanetScene } from './components/PlanetScene';
import { HUD } from './components/HUD';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function GameView() {
  const gameState = useGameState();

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <PlanetScene gameState={gameState} />
      </div>
      <div className="absolute inset-0 z-10">
        <HUD gameState={gameState} />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
