import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useGameState } from './hooks/useGameState';
import { PlanetScene } from './components/PlanetScene';
import { HUD } from './components/HUD';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function GameView() {
  const gameState = useGameState();

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) { // scroll down = zoom out
      if (gameState.zoomLevel === 2) gameState.setZoomLevel(1);
      else if (gameState.zoomLevel === 1) gameState.setZoomLevel(0);
    } else { // scroll up = zoom in
      if (gameState.zoomLevel === 0) gameState.setZoomLevel(1);
      else if (gameState.zoomLevel === 1) gameState.setZoomLevel(2);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#030014] overflow-hidden relative" onWheel={handleWheel}>
      <div className="absolute inset-0 z-0">
        <PlanetScene gameState={gameState} />
      </div>
      <div className="absolute inset-0 z-10">
        <HUD gameState={gameState} />
      </div>
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
