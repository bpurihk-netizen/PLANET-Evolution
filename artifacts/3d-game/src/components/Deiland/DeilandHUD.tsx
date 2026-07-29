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

// ── Constants ──────────────────────────────────────────────────────────────────
const OUTER_RADIUS = 65;   // outer ring radius px  (130px diameter > 120px req)
const KNOB_RADIUS  = 22;   // knob radius px
const DEAD_ZONE    = 0.18; // normalised dead zone

/** Apply dead zone + remap so full range [0,1] is reachable above dead zone. */
function applyDeadZone(raw: number, dz: number): number {
  const sign = raw >= 0 ? 1 : -1;
  const abs  = Math.abs(raw);
  if (abs < dz) return 0;
  return sign * (abs - dz) / (1 - dz);
}

// ── DeviceOrientation helper ───────────────────────────────────────────────────
async function requestGyroPermission(): Promise<boolean> {
  // iOS 13+ needs explicit permission
  const dme = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof dme.requestPermission === 'function') {
    const result = await dme.requestPermission();
    return result === 'granted';
  }
  return true; // Android / desktop grant silently
}

// ── Component ─────────────────────────────────────────────────────────────────
export const DeilandHUD: React.FC<DeilandHUDProps> = ({ planetName, joystickRef, onExit }) => {
  // Knob offset state for visual feedback
  const [knobOffset, setKnobOffset]   = useState({ x: 0, y: 0 });
  const [isActive, setIsActive]       = useState(false);
  const [gyroMode, setGyroMode]       = useState(false);

  const activeTouch = useRef<number | null>(null);
  const padCenterRef = useRef({ x: 85, y: window.innerHeight - 90 }); // fixed bottom-left

  // ── Dead-zone + normalise helper ──────────────────────────────────────────
  const writeJoystick = useCallback((rawX: number, rawY: number) => {
    const nx = applyDeadZone(rawX, DEAD_ZONE);
    const ny = applyDeadZone(rawY, DEAD_ZONE);
    joystickRef.current = { x: nx, y: ny };
  }, [joystickRef]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gyroMode) return; // gyro mode: ignore touch for movement
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      // Accept touch starting anywhere in left 55% of screen
      if (t.clientX < window.innerWidth * 0.55 && activeTouch.current === null) {
        activeTouch.current = t.identifier;
        // Dynamically re-centre the pad to where the finger landed
        padCenterRef.current = { x: t.clientX, y: t.clientY };
        setIsActive(true);
        setKnobOffset({ x: 0, y: 0 });
        joystickRef.current = { x: 0, y: 0 };
        e.preventDefault();
        break;
      }
    }
  }, [gyroMode, joystickRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gyroMode) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeTouch.current) {
        const dx = t.clientX - padCenterRef.current.x;
        const dy = t.clientY - padCenterRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, OUTER_RADIUS);
        const angle = Math.atan2(dy, dx);
        const cx = Math.cos(angle) * clampedDist;
        const cy = Math.sin(angle) * clampedDist;
        setKnobOffset({ x: cx, y: cy });
        // Normalise to [-1, 1] then apply dead zone
        writeJoystick(cx / OUTER_RADIUS, -cy / OUTER_RADIUS);
        e.preventDefault();
        break;
      }
    }
  }, [gyroMode, writeJoystick]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        activeTouch.current = null;
        setIsActive(false);
        setKnobOffset({ x: 0, y: 0 });
        // Don't zero immediately — let DeilandScene's inertia decay handle it
        // but DO signal zero intent so inertia knows finger is off
        joystickRef.current = { x: 0, y: 0 };
        break;
      }
    }
  }, [joystickRef]);

  // ── DeviceOrientation ─────────────────────────────────────────────────────
  const toggleGyro = useCallback(async () => {
    if (gyroMode) {
      setGyroMode(false);
      joystickRef.current = { x: 0, y: 0 };
      return;
    }
    const granted = await requestGyroPermission();
    if (granted) setGyroMode(true);
    else alert('ジャイロセンサーの許可が必要です');
  }, [gyroMode, joystickRef]);

  useEffect(() => {
    if (!gyroMode) return;
    const BASE_BETA = 40; // typical holding angle
    const handler = (e: DeviceOrientationEvent) => {
      const beta  = e.beta  ?? 0; // -90 to +90 (front/back tilt)
      const gamma = e.gamma ?? 0; // -90 to +90 (left/right tilt)
      const rawX  =  gamma / 25;                // tilt right → move right
      const rawY  = -(beta - BASE_BETA) / 20;   // tilt forward → move forward
      const cx = Math.max(-1, Math.min(1, rawX));
      const cy = Math.max(-1, Math.min(1, rawY));
      writeJoystick(cx, cy);
      // Update knob display
      setKnobOffset({ x: cx * OUTER_RADIUS, y: -cy * OUTER_RADIUS });
      setIsActive(Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05);
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [gyroMode, writeJoystick]);

  // Compute pad position: re-centre when finger is active
  const padX = isActive ? padCenterRef.current.x : 85;
  const padY = isActive ? padCenterRef.current.y : window.innerHeight - 90;

  return (
    <div
      className="absolute inset-0"
      onTouchStart={handleTouchStart as any}
      onTouchMove={handleTouchMove as any}
      onTouchEnd={handleTouchEnd as any}
      style={{ touchAction: 'none', pointerEvents: 'auto' }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 pb-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex flex-col">
          <span className="text-white/50 text-[10px] font-mono tracking-widest">NOW EXPLORING</span>
          <span className="text-white font-bold text-lg tracking-wide">{planetName}</span>
        </div>
        <div className="text-white/40 text-xs font-mono hidden sm:block">
          WASD / 矢印キー で移動
        </div>
      </div>

      {/* ── Exit button ──────────────────────────────────────────────── */}
      <button
        className="absolute top-6 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 border border-white/20 rounded-full text-white text-sm font-bold backdrop-blur-md active:scale-95 transition-transform pointer-events-auto"
        onClick={onExit}
      >
        ← 宇宙へ戻る
      </button>

      {/* ── Virtual joystick pad ─────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left:      padX - OUTER_RADIUS,
          top:       padY - OUTER_RADIUS,
          width:     OUTER_RADIUS * 2,
          height:    OUTER_RADIUS * 2,
          opacity:   isActive ? 0.82 : 0.28,
          transition: isActive ? 'opacity 0.1s ease' : 'opacity 0.4s ease',
        }}
      >
        {/* Outer ring — layered for depth */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
            border:     '2px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(6px)',
            boxShadow:  '0 0 18px rgba(100,180,255,0.18) inset, 0 2px 12px rgba(0,0,0,0.4)',
          }}
        />
        {/* Inner guide ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: OUTER_RADIUS * 0.35,
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '50%',
          }}
        />
        {/* Cross-hair lines */}
        <div style={{
          position: 'absolute',
          left: '50%', top: OUTER_RADIUS * 0.18, bottom: OUTER_RADIUS * 0.18,
          width: 1, background: 'rgba(255,255,255,0.10)', transform: 'translateX(-50%)',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%', left: OUTER_RADIUS * 0.18, right: OUTER_RADIUS * 0.18,
          height: 1, background: 'rgba(255,255,255,0.10)', transform: 'translateY(-50%)',
        }} />
        {/* Knob */}
        <div
          style={{
            position: 'absolute',
            width:     KNOB_RADIUS * 2,
            height:    KNOB_RADIUS * 2,
            left:      OUTER_RADIUS - KNOB_RADIUS + knobOffset.x,
            top:       OUTER_RADIUS - KNOB_RADIUS + knobOffset.y,
            borderRadius: '50%',
            background:   isActive
              ? 'radial-gradient(circle at 35% 30%, rgba(200,230,255,0.95), rgba(80,160,255,0.80))'
              : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(180,200,230,0.65))',
            boxShadow: isActive
              ? '0 0 14px rgba(80,160,255,0.7), 0 2px 8px rgba(0,0,0,0.5)'
              : '0 2px 6px rgba(0,0,0,0.4)',
            transition: isActive ? 'none' : 'left 0.18s ease, top 0.18s ease, box-shadow 0.2s ease',
          }}
        />
      </div>

      {/* ── Gyro toggle button ────────────────────────────────────────── */}
      <button
        className="absolute pointer-events-auto"
        onClick={toggleGyro}
        style={{
          bottom: 96, left: 14,
          background: gyroMode ? 'rgba(60,120,220,0.75)' : 'rgba(0,0,0,0.45)',
          border: `1px solid ${gyroMode ? 'rgba(120,180,255,0.8)' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 20, padding: '4px 10px',
          color: gyroMode ? '#a0d0ff' : 'rgba(255,255,255,0.45)',
          fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        📱 ジャイロ{gyroMode ? ' ON' : ''}
      </button>

      {/* ── Mobile hint (only when pad is not active and no gyro) ──── */}
      {!isActive && !gyroMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 text-xs font-mono pointer-events-none sm:hidden">
          左タップ＆ドラッグで移動
        </div>
      )}
    </div>
  );
};
