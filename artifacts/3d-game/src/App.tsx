import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useGameState } from './hooks/useGameState';
import { PlanetScene } from './components/PlanetScene';
import { HUD } from './components/HUD';
import { SpaceShooter } from './components/SpaceShooter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function GameView() {
  const gameState = useGameState();

  return (
    <div className="w-full h-[100dvh] bg-[#030014] overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <PlanetScene gameState={gameState} />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <HUD gameState={gameState} />
      </div>
      {gameState.shooterMode !== 'off' && (
        <SpaceShooter gameState={gameState} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
         <Switch>
           <Route path="/" component={GameView} />
           <Route component={NotFound} />
         </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
