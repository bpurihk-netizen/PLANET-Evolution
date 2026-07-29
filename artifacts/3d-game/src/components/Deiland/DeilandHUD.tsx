import React, { useRef, useState, useEffect, useCallback } from 'react';

interface JoystickState {
  x: number;
  y: number;
}

interface DeilandHUDProps {
  planetName:    string;
  joystickRef:   React.MutableRefObject<JoystickState>;
  cameraYawRef:  React.MutableRefObject<number>;
  jumpRef:       React.MutableRefObject<boolean>;
  onExit:        () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const OUTER_RADIUS    = 65;   // outer ring radius px  (130px diameter > 120px req)
const KNOB_RADIUS     = 22;   // knob radius px
const DEAD_ZONE       = 0.18; // normalised dead zone
const CAM_SWIPE_SENS  = 0.006; // radians per pixel of horizontal swipe

/** Apply dead zone + remap so full range [0,1] is reachable above dead zone. */
function applyDeadZone(raw: number, dz: number): number {
  const sign = raw >= 0 ? 1 : -1;
  const abs  = Math.abs(raw);
  if (abs < dz) return 0;
  return sign * (abs - dz) / (1 - dz);
}

// ── DeviceOrientation helper ───────────────────────────────────────────────────
async function requestGyroPermission(): Promise<boolean> {
  const dme = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof dme.requestPermission === 'function') {
    const result = await dme.requestPermission();
    return result === 'granted';
  }
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const DeilandHUD: React.FC<DeilandHUDProps> = ({
  planetName, joystickRef, cameraYawRef, jumpRef, onExit,
}) => {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive]     = useState(false);
  const [gyroMode, setGyroMode]     = useState(false);
  const [camSwipeActive, setCamSwipeActive] = useState(false);

  const activeTouch    = useRef<number | null>(null);
  const padCenterRef   = useRef({ x: 85, y: window.innerHeight - 90 });
  // Camera swipe state (right-side touch)
  const camTouchRef    = useRef<{ id: number; lastX: number } | null>(null);

  // ── Dead-zone + normalise ────────────────────────────────────────────────────
  const writeJoystick = useCallback((rawX: number, rawY: number) => {
    joystickRef.current = {
      x: applyDeadZone(rawX, DEAD_ZONE),
      y: applyDeadZone(rawY, DEAD_ZONE),
    };
  }, [joystickRef]);

  // ── Touch handlers ───────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (gyroMode) continue;

      if (t.clientX < window.innerWidth * 0.55 && activeTouch.current === null) {
        // ── Left zone → joystick ────────────────────────────────────────────
        activeTouch.current = t.identifier;
        padCenterRef.current = { x: t.clientX, y: t.clientY };
        setIsActive(true);
        setKnobOffset({ x: 0, y: 0 });
        joystickRef.current = { x: 0, y: 0 };
        e.preventDefault();
      } else if (t.clientX >= window.innerWidth * 0.55 && camTouchRef.current === null) {
        // ── Right zone → camera swipe ───────────────────────────────────────
        camTouchRef.current = { id: t.identifier, lastX: t.clientX };
        setCamSwipeActive(true);
        e.preventDefault();
      }
    }
  }, [gyroMode, joystickRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];

      // Joystick move
      if (!gyroMode && t.identifier === activeTouch.current) {
        const dx = t.clientX - padCenterRef.current.x;
        const dy = t.clientY - padCenterRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, OUTER_RADIUS);
        const angle = Math.atan2(dy, dx);
        const cx = Math.cos(angle) * clampedDist;
        const cy = Math.sin(angle) * clampedDist;
        setKnobOffset({ x: cx, y: cy });
        writeJoystick(cx / OUTER_RADIUS, -cy / OUTER_RADIUS);
        e.preventDefault();
      }

      // Camera swipe move
      if (camTouchRef.current && t.identifier === camTouchRef.current.id) {
        const dx = t.clientX - camTouchRef.current.lastX;
        // Left swipe → rotate camera right (decrease yaw); right swipe → rotate left
        cameraYawRef.current -= dx * CAM_SWIPE_SENS;
        camTouchRef.current.lastX = t.clientX;
        e.preventDefault();
      }
    }
  }, [gyroMode, writeJoystick, cameraYawRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeTouch.current) {
        activeTouch.current = null;
        setIsActive(false);
        setKnobOffset({ x: 0, y: 0 });
        joystickRef.current = { x: 0, y: 0 };
      }
      if (camTouchRef.current && t.identifier === camTouchRef.current.id) {
        camTouchRef.current = null;
        setCamSwipeActive(false);
      }
    }
  }, [joystickRef]);

  // ── DeviceOrientation ────────────────────────────────────────────────────────
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
    const BASE_BETA = 40;
    const handler = (e: DeviceOrientationEvent) => {
      const beta  = e.beta  ?? 0;
      const gamma = e.gamma ?? 0;
      const rawX  =  gamma / 25;
      const rawY  = -(beta - BASE_BETA) / 20;
      const cx = Math.max(-1, Math.min(1, rawX));
      const cy = Math.max(-1, Math.min(1, rawY));
      writeJoystick(cx, cy);
      setKnobOffset({ x: cx * OUTER_RADIUS, y: -cy * OUTER_RADIUS });
      setIsActive(Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05);
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [gyroMode, writeJoystick]);

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
          WASD / 矢印キー で移動 ｜ Q/E カメラ回転
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
          left:       padX - OUTER_RADIUS,
          top:        padY - OUTER_RADIUS,
          width:      OUTER_RADIUS * 2,
          height:     OUTER_RADIUS * 2,
          opacity:    isActive ? 0.82 : 0.28,
          transition: isActive ? 'opacity 0.1s ease' : 'opacity 0.4s ease',
        }}
      >
        <div className="absolute inset-0 rounded-full" style={{
          background:     'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
          border:         '2px solid rgba(255,255,255,0.35)',
          backdropFilter: 'blur(6px)',
          boxShadow:      '0 0 18px rgba(100,180,255,0.18) inset, 0 2px 12px rgba(0,0,0,0.4)',
        }} />
        <div className="absolute rounded-full" style={{
          inset: OUTER_RADIUS * 0.35, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '50%',
        }} />
        <div style={{ position:'absolute', left:'50%', top: OUTER_RADIUS*0.18, bottom: OUTER_RADIUS*0.18, width:1, background:'rgba(255,255,255,0.10)', transform:'translateX(-50%)' }} />
        <div style={{ position:'absolute', top:'50%', left: OUTER_RADIUS*0.18, right: OUTER_RADIUS*0.18, height:1, background:'rgba(255,255,255,0.10)', transform:'translateY(-50%)' }} />
        <div style={{
          position: 'absolute',
          width:  KNOB_RADIUS * 2, height: KNOB_RADIUS * 2,
          left:   OUTER_RADIUS - KNOB_RADIUS + knobOffset.x,
          top:    OUTER_RADIUS - KNOB_RADIUS + knobOffset.y,
          borderRadius: '50%',
          background: isActive
            ? 'radial-gradient(circle at 35% 30%, rgba(200,230,255,0.95), rgba(80,160,255,0.80))'
            : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(180,200,230,0.65))',
          boxShadow: isActive ? '0 0 14px rgba(80,160,255,0.7), 0 2px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.4)',
          transition: isActive ? 'none' : 'left 0.18s ease, top 0.18s ease, box-shadow 0.2s ease',
        }} />
      </div>

      {/* ── Right-zone swipe indicator ──────────────────────────────── */}
      {camSwipeActive && (
        <div
          className="absolute pointer-events-none"
          style={{
            right: 0, top: 0, bottom: 0,
            width: '45%',
            background: 'linear-gradient(to left, rgba(80,160,255,0.07), transparent)',
            borderLeft: '1px solid rgba(80,160,255,0.15)',
          }}
        />
      )}

      {/* ── Jump button (bottom-right) ───────────────────────────────── */}
      <button
        className="absolute pointer-events-auto select-none"
        onPointerDown={e => { e.preventDefault(); jumpRef.current = true; }}
        style={{
          bottom: 110, right: 22,
          width: 68, height: 68,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, rgba(160,220,255,0.92), rgba(60,130,230,0.80))',
          border: '2px solid rgba(140,200,255,0.85)',
          boxShadow: '0 0 18px rgba(80,160,255,0.45), 0 3px 12px rgba(0,0,0,0.55)',
          color: '#fff', fontSize: 26, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', userSelect: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        ↑
      </button>

      {/* ── Gyro toggle ──────────────────────────────────────────────── */}
      <button
        className="absolute pointer-events-auto"
        onClick={toggleGyro}
        style={{
          bottom: 96, left: 14,
          background:   gyroMode ? 'rgba(60,120,220,0.75)' : 'rgba(0,0,0,0.45)',
          border:       `1px solid ${gyroMode ? 'rgba(120,180,255,0.8)' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 20, padding: '4px 10px',
          color:        gyroMode ? '#a0d0ff' : 'rgba(255,255,255,0.45)',
          fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        📱 ジャイロ{gyroMode ? ' ON' : ''}
      </button>

      {/* ── Mobile hint ──────────────────────────────────────────────── */}
      {!isActive && !gyroMode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/25 text-xs font-mono pointer-events-none sm:hidden">
          左でキャラ移動 ／ 右スワイプでカメラ回転
        </div>
      )}
    </div>
  );
};
