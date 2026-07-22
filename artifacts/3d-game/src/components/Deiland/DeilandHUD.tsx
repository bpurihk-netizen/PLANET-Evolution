import React, { useRef, useState, useEffect, useCallback } from 'react';

interface JoystickState {
  x: number;
  y: number;
}

interface DeilandHUDProps {
  planetName: string;
  joystickRef: React.MutableRefObject<JoystickState>;
  onExit: () => void;
}

const JOYSTICK_RADIUS = 50;
const DOT_RADIUS = 18;

export const DeilandHUD: React.FC<DeilandHUDProps> = ({ planetName, joystickRef, onExit }) => {
  const [dotOffset, setDotOffset] = useState({ x: 0, y: 0 });
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickVisible, setJoystickVisible] = useState(false);
  const activeTouch = useRef<number | null>(null);

  const clampDot = useCallback((dx: number, dy: number) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_RADIUS) {
      const scale = JOYSTICK_RADIUS / dist;
      return { x: dx * scale, y: dy * scale };
    }
    return { x: dx, y: dy };
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.clientX < window.innerWidth * 0.55 && activeTouch.current === null) {
        activeTouch.current = t.identifier;
        setJoystickCenter({ x: t.clientX, y: t.clientY });
        setJoystickVisible(true);
        setDotOffset({ x: 0, y: 0 });
        joystickRef.current = { x: 0, y: 0 };
        e.preventDefault();
        break;
      }
    }
  }, [joystickRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeTouch.current) {
        setJoystickCenter(prev => {
          const dx = t.clientX - prev.x;
          const dy = t.clientY - prev.y;
          const clamped = clampDot(dx, dy);
          setDotOffset(clamped);
          joystickRef.current = {
            x: clamped.x / JOYSTICK_RADIUS,
            y: -clamped.y / JOYSTICK_RADIUS,
          };
          return prev;
        });
        e.preventDefault();
        break;
      }
    }
  }, [joystickRef, clampDot]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        activeTouch.current = null;
        setJoystickVisible(false);
        setDotOffset({ x: 0, y: 0 });
        joystickRef.current = { x: 0, y: 0 };
        break;
      }
    }
  }, [joystickRef]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onTouchStart={handleTouchStart as any}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd as any}
      style={{ touchAction: 'none', pointerEvents: 'auto' }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 pb-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex flex-col">
          <span className="text-white/50 text-[10px] font-mono tracking-widest">NOW EXPLORING</span>
          <span className="text-white font-bold text-lg tracking-wide">{planetName}</span>
        </div>
        <div className="text-white/40 text-xs font-mono hidden sm:block">
          WASD / 矢印キー で移動
        </div>
      </div>

      {/* Exit button */}
      <button
        className="absolute top-6 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 border border-white/20 rounded-full text-white text-sm font-bold backdrop-blur-md active:scale-95 transition-transform pointer-events-auto"
        onClick={onExit}
      >
        ← 宇宙へ戻る
      </button>

      {/* Virtual joystick */}
      {joystickVisible && (
        <div
          className="absolute"
          style={{
            left: joystickCenter.x - JOYSTICK_RADIUS,
            top:  joystickCenter.y - JOYSTICK_RADIUS,
            width:  JOYSTICK_RADIUS * 2,
            height: JOYSTICK_RADIUS * 2,
            pointerEvents: 'none',
          }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/30 bg-white/5 backdrop-blur-sm" />
          {/* Dot */}
          <div
            className="absolute rounded-full bg-white/70 shadow-lg"
            style={{
              width:  DOT_RADIUS * 2,
              height: DOT_RADIUS * 2,
              left:   JOYSTICK_RADIUS - DOT_RADIUS + dotOffset.x,
              top:    JOYSTICK_RADIUS - DOT_RADIUS + dotOffset.y,
              transition: 'none',
            }}
          />
        </div>
      )}

      {/* Mobile control hint (bottom center) */}
      {!joystickVisible && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono pointer-events-none sm:hidden">
          左タップ＆ドラッグで移動
        </div>
      )}
    </div>
  );
};
