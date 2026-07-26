import React, { useEffect, useRef, useState } from 'react';

// ── Web Audio warp sound synthesiser ─────────────────────────────────────────
function playWarpSound(durationMs: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const end = ctx.currentTime + durationMs / 1000;

    // 1. Rising pitch sweep — gives the "spooling up" feel
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + durationMs * 0.45 / 1000);
    osc1.frequency.exponentialRampToValueAtTime(200, end);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.12);
    gain1.gain.linearRampToValueAtTime(0.22, ctx.currentTime + durationMs * 0.55 / 1000);
    gain1.gain.linearRampToValueAtTime(0, end);
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(); osc1.stop(end);

    // 2. Sub-bass rumble
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(40, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(80, ctx.currentTime + durationMs * 0.3 / 1000);
    osc2.frequency.linearRampToValueAtTime(30, end);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.30, ctx.currentTime + 0.18);
    gain2.gain.linearRampToValueAtTime(0, end);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(); osc2.stop(end);

    // 3. White-noise burst at launch
    const bufSize = ctx.sampleRate * 0.35;
    const noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start();

    // 4. High shimmer
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2200, ctx.currentTime);
    osc3.frequency.linearRampToValueAtTime(4800, ctx.currentTime + durationMs * 0.6 / 1000);
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
    gain3.gain.linearRampToValueAtTime(0, end);
    osc3.connect(gain3); gain3.connect(ctx.destination);
    osc3.start(); osc3.stop(end);

    // Auto-close context after playback
    setTimeout(() => { try { ctx.close(); } catch {} }, durationMs + 200);
  } catch {
    // Silently ignore if AudioContext is not available
  }
}

interface WarpOverlayProps {
  isActive: boolean;
  destinationName: string;
  distanceLy: number;
  /** Called when the warp animation completes */
  onComplete: () => void;
}

// ── Star streak canvas animation ─────────────────────────────────────────────
const WARP_DURATION_MS = 2600;

interface Streak {
  angle: number;
  speed: number;
  length: number;
  brightness: number;
  color: string;
}

const STREAK_COLORS = [
  'rgba(200,220,255,',
  'rgba(255,255,255,',
  'rgba(180,200,255,',
  'rgba(255,240,220,',
];

function makeStreaks(n: number): Streak[] {
  return Array.from({ length: n }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.2,
    length: 0.02 + Math.random() * 0.06,
    brightness: 0.4 + Math.random() * 0.6,
    color: STREAK_COLORS[Math.floor(Math.random() * STREAK_COLORS.length)],
  }));
}

const WarpCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streaksRef = useRef<Streak[]>(makeStreaks(220));
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    startRef.current = performance.now();

    const draw = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / WARP_DURATION_MS, 1);

      // Intensity curve: fast ramp-up, hold, ramp-down
      let intensity: number;
      if (t < 0.2) intensity = t / 0.2;
      else if (t < 0.75) intensity = 1;
      else intensity = 1 - (t - 0.75) / 0.25;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      // Trail fade
      ctx.fillStyle = `rgba(2,4,8,${0.25 + intensity * 0.1})`;
      ctx.fillRect(0, 0, w, h);

      streaksRef.current.forEach(s => {
        const spd = s.speed * intensity;
        const r0 = maxR * s.length * intensity;
        const r1 = r0 + maxR * s.length * intensity * 1.6;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.angle) * r0, cy + Math.sin(s.angle) * r0);
        ctx.lineTo(cx + Math.cos(s.angle) * r1, cy + Math.sin(s.angle) * r1);
        ctx.strokeStyle = `${s.color}${(s.brightness * intensity).toFixed(2)})`;
        ctx.lineWidth = 0.8 + intensity * 1.2;
        ctx.stroke();

        // Advance streak outward
        s.length = Math.min(s.length + spd * 0.0004, 0.5);
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
};

// ── Distance formatter ────────────────────────────────────────────────────────
function formatDistance(ly: number): string {
  if (ly === 0) return '太陽系（基準）';
  if (ly < 10) return `${ly.toFixed(2)}光年`;
  if (ly < 1000) return `${Math.round(ly)}光年`;
  return `${(ly / 1000).toFixed(1)}千光年`;
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export const WarpOverlay: React.FC<WarpOverlayProps> = ({
  isActive,
  destinationName,
  distanceLy,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  // Always-current ref so timers never capture a stale callback
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    if (!isActive) return;

    // Reset and start
    clearAllTimers();
    setVisible(true);
    setTextVisible(false);

    // Fire warp sound effect
    playWarpSound(WARP_DURATION_MS);

    const t1 = setTimeout(() => setTextVisible(true), 300);

    const t2 = setTimeout(() => {
      setTextVisible(false);
    }, WARP_DURATION_MS - 500);

    const t3 = setTimeout(() => {
      setVisible(false);
      onCompleteRef.current();
    }, WARP_DURATION_MS);

    timersRef.current = [t1, t2, t3];

    return () => clearAllTimers();
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        overflow: 'hidden',
        // Keep pointer events active to block clicks on system selector during warp
        pointerEvents: 'all',
      }}
    >
      {/* Star streak canvas */}
      <WarpCanvas />

      {/* Central text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          transition: 'opacity 0.5s ease',
          opacity: textVisible ? 1 : 0,
          padding: '0 24px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* WARP label */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#88aaff',
            textTransform: 'uppercase',
            marginBottom: '4px',
            textShadow: '0 0 12px #4466ff',
          }}
        >
          ワープ中
        </div>

        {/* Destination name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 800,
            color: '#e8f0ff',
            textShadow: '0 0 30px rgba(100,160,255,0.9), 0 0 60px rgba(60,100,255,0.5)',
            lineHeight: 1.2,
          }}
        >
          {destinationName}
        </div>

        {/* Journey line */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 18px)',
            color: 'rgba(160,190,255,0.85)',
            textShadow: '0 0 16px rgba(80,130,255,0.6)',
          }}
        >
          {distanceLy === 0
            ? '太陽系へ帰還中…'
            : `地球から ${formatDistance(distanceLy)} の旅`}
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: '16px',
            width: 'min(240px, 60vw)',
            height: '2px',
            background: 'rgba(80,120,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #4477ff, #88aaff)',
              borderRadius: '2px',
              animation: `warpProgress ${WARP_DURATION_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes warpProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};
