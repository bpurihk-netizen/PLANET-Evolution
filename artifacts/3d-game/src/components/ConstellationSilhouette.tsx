import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getConstellationArt, StarName } from '../data/constellationArt';

interface ConstellationSilhouetteProps {
  constellationId: string;
  accentColor?: string;
  /** Width/height of the SVG element (square). Default 200 */
  size?: number;
  className?: string;
  /** Enable tap-to-show-star-name interaction. Default true. */
  interactive?: boolean;
  /**
   * When true, plays the line-drawing animation on mount.
   * Re-mounting the component replays the animation (works naturally when cards expand/collapse).
   */
  animate?: boolean;
}

export const ConstellationSilhouette: React.FC<ConstellationSilhouetteProps> = ({
  constellationId,
  accentColor = '#7eb8ff',
  size = 200,
  className,
  interactive = true,
  animate = false,
}) => {
  const art = useMemo(() => getConstellationArt(constellationId), [constellationId]);
  // Stable random suffix per constellationId (avoids filter ID collisions in multi-instance renders)
  const idSuffix = useMemo(() => Math.random().toString(36).slice(2, 7), [constellationId]);
  const svgId = `cs-${constellationId}-${idSuffix}`;

  const [activeStar, setActiveStar] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animation state ────────────────────────────────────────────────────────
  // `drawn` flips to true after two animation frames, triggering CSS transitions.
  const [drawn, setDrawn] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setDrawn(true);
      return;
    }
    setDrawn(false);
    // Double-rAF ensures the browser has painted the initial "hidden" state before
    // we flip `drawn`, so the CSS transition actually plays.
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setDrawn(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []); // intentionally only on mount — re-mounting replays automatically

  // Reset when constellation changes
  useEffect(() => {
    setActiveStar(null);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [constellationId]);

  const handleStarClick = useCallback((e: React.MouseEvent | React.TouchEvent, index: number) => {
    if (!interactive) return;
    const starName = art.starNames?.[index];
    if (!starName) return;
    e.stopPropagation();
    setActiveStar(prev => (prev === index ? null : index));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveStar(null), 3500);
  }, [art, interactive]);

  const dismissPopup = useCallback(() => {
    setActiveStar(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Popup positioning: keep tooltip inside bounds
  const popupStyle = useMemo((): React.CSSProperties => {
    if (activeStar === null) return {};
    const [x, y] = art.stars[activeStar];
    const flipUp = y > 58;
    const clampedX = Math.min(Math.max(x, 12), 88);
    return {
      position: 'absolute',
      left: `${clampedX}%`,
      top: `${y}%`,
      transform: flipUp ? 'translate(-50%, calc(-100% - 8px))' : 'translate(-50%, 8px)',
      pointerEvents: 'none',
      zIndex: 10,
    };
  }, [activeStar, art.stars]);

  const activeStarData = activeStar !== null ? (art.starNames?.[activeStar] ?? null) : null;

  // ── Animation metrics ──────────────────────────────────────────────────────
  // SVG viewBox is 0-100, so coordinate distances are in those units.
  const numLines = art.lines.length;
  const TOTAL_MS = 800; // total animation duration
  const LINE_DRAW_MS = Math.max(280, TOTAL_MS / Math.max(numLines, 1)); // per-line draw duration

  // For each line: start delay, Euclidean length in SVG units
  const lineMetrics = useMemo(() => art.lines.map(([a, b], i) => {
    const [x1, y1] = art.stars[a];
    const [x2, y2] = art.stars[b];
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    // Stagger: each line starts slightly after the previous
    const delayMs = numLines <= 1 ? 0 : (i / (numLines - 1)) * (TOTAL_MS - LINE_DRAW_MS * 0.5);
    return { length, delayMs };
  }), [art, numLines]);

  // For each star: earliest line that touches it → use that line's delay as star appearance delay
  const starDelays = useMemo(() => {
    const delays = new Array(art.stars.length).fill(TOTAL_MS + 100); // default: after all lines
    art.lines.forEach(([a, b], i) => {
      const d = lineMetrics[i].delayMs;
      if (d < delays[a]) delays[a] = d;
      if (d < delays[b]) delays[b] = d;
    });
    // Stars with no connected line appear at 0
    return delays.map(d => (d === TOTAL_MS + 100 ? 0 : d));
  }, [art, lineMetrics]);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', width: size, height: size }}
      onClick={dismissPopup}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${svgId}-bg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
          </radialGradient>

          <filter id={`${svgId}-glow`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${svgId}-active-glow`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${svgId}-sfx`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Bright-star burst filter used during animation entry */}
          <filter id={`${svgId}-burst`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background radial glow */}
        <circle cx="50" cy="50" r="50" fill={`url(#${svgId}-bg)`} />

        {/* Tiny background star field */}
        {BACKGROUND_STARS.map((s, i) => (
          <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill="white" opacity={s[3]} />
        ))}

        {/* Mythological silhouette (behind lines) */}
        {art.silhouette && (
          <path
            d={art.silhouette}
            fill={accentColor}
            opacity={0.06}
            filter={`url(#${svgId}-sfx)`}
          />
        )}

        {/* Constellation lines — animated with stroke-dashoffset */}
        {art.lines.map(([a, b], i) => {
          const [x1, y1] = art.stars[a];
          const [x2, y2] = art.stars[b];
          const { length, delayMs } = lineMetrics[i];
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={accentColor}
              strokeWidth="0.6"
              strokeOpacity={drawn ? 0.45 : 0.45}
              strokeLinecap="round"
              style={{
                strokeDasharray: animate ? length : undefined,
                strokeDashoffset: animate ? (drawn ? 0 : length) : undefined,
                transition: animate
                  ? `stroke-dashoffset ${LINE_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${delayMs}ms`
                  : undefined,
              }}
            />
          );
        })}

        {/* Stars — animated with opacity + scale */}
        {art.stars.map(([x, y], i) => {
          const starName = art.starNames?.[i];
          const hasName = !!starName;
          const isActive = activeStar === i;
          const isBrightest = !!starName?.isBrightest;
          const starDelayMs = starDelays[i];

          return (
            <g
              key={i}
              filter={isActive ? `url(#${svgId}-active-glow)` : `url(#${svgId}-glow)`}
              onClick={hasName && interactive ? (e) => handleStarClick(e, i) : undefined}
              style={{
                cursor: hasName && interactive ? 'pointer' : undefined,
                opacity: animate ? (drawn ? 1 : 0) : 1,
                transition: animate
                  ? `opacity 300ms ease-out ${starDelayMs + LINE_DRAW_MS * 0.6}ms`
                  : undefined,
              }}
            >
              {/* Invisible tap-friendly hit area */}
              {hasName && interactive && (
                <circle cx={x} cy={y} r={6} fill="transparent" />
              )}

              {/* Outer glow ring */}
              <circle
                cx={x} cy={y}
                r={isActive ? 3.8 : (isBrightest ? 2.8 : 2.2)}
                fill={accentColor}
                opacity={isActive ? 0.5 : (isBrightest ? 0.28 : 0.18)}
              />
              {/* Core */}
              <circle
                cx={x} cy={y}
                r={isActive ? 1.9 : (isBrightest ? 1.5 : 1.1)}
                fill={isActive ? 'white' : accentColor}
                opacity={isActive ? 1.0 : 0.9}
              />
              {/* Hot white center */}
              <circle
                cx={x} cy={y}
                r={isActive ? 0.75 : 0.45}
                fill="white"
                opacity={0.95}
              />

              {/* Subtle dashed ring hint for named stars (shows they're tappable) */}
              {hasName && !isActive && interactive && (
                <circle
                  cx={x} cy={y} r={3.0}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="0.22"
                  strokeOpacity="0.32"
                  strokeDasharray="0.9 0.7"
                />
              )}

              {/* Brightest star 4-point sparkle */}
              {isBrightest && !isActive && (
                <g opacity={0.55}>
                  <line x1={x} y1={y - 3.5} x2={x} y2={y - 1.9} stroke="white" strokeWidth="0.35" />
                  <line x1={x} y1={y + 1.9} x2={x} y2={y + 3.5} stroke="white" strokeWidth="0.35" />
                  <line x1={x - 3.5} y1={y} x2={x - 1.9} y2={y} stroke="white" strokeWidth="0.35" />
                  <line x1={x + 1.9} y1={y} x2={x + 3.5} y2={y} stroke="white" strokeWidth="0.35" />
                </g>
              )}

              {/* Entry flash: bright ring that fades out as the star "lights up" */}
              {animate && (
                <circle
                  cx={x} cy={y}
                  r={isBrightest ? 5.5 : 4.0}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="0.5"
                  style={{
                    opacity: drawn ? 0 : 0,
                    transition: animate
                      ? `opacity 500ms ease-out ${starDelayMs + LINE_DRAW_MS * 0.6}ms`
                      : undefined,
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Star name popup — rendered as an overlay div for legibility */}
      {activeStarData && activeStar !== null && (
        <div style={popupStyle}>
          <StarNamePopup starName={activeStarData} accentColor={accentColor} />
        </div>
      )}
    </div>
  );
};

// ── Star Name Popup ────────────────────────────────────────────────────────────
interface StarNamePopupProps {
  starName: StarName;
  accentColor: string;
}

const StarNamePopup: React.FC<StarNamePopupProps> = ({ starName, accentColor }) => (
  <div
    style={{
      background: 'rgba(4, 8, 18, 0.93)',
      border: `1px solid ${accentColor}55`,
      borderRadius: 10,
      padding: '7px 11px',
      minWidth: 96,
      maxWidth: 160,
      boxShadow: `0 0 18px ${accentColor}25, 0 6px 24px rgba(0,0,0,0.8)`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      whiteSpace: 'nowrap',
    }}
  >
    {/* Japanese name row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
      {starName.isBrightest && (
        <span style={{ color: '#fbbf24', fontSize: 9, lineHeight: 1, flexShrink: 0 }}>★</span>
      )}
      <span style={{
        color: 'rgba(255,255,255,0.96)',
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}>
        {starName.nameJa}
      </span>
    </div>

    {/* English name */}
    <div style={{
      color: accentColor,
      fontSize: 9.5,
      fontFamily: 'monospace',
      opacity: 0.9,
      marginBottom: starName.meaning ? 4 : 0,
      whiteSpace: 'nowrap',
    }}>
      {starName.nameEn}
    </div>

    {/* Meaning / origin note */}
    {starName.meaning && (
      <div style={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: 8.5,
        lineHeight: 1.5,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 4,
        marginTop: 1,
        whiteSpace: 'normal',
        maxWidth: 148,
      }}>
        {starName.meaning}
      </div>
    )}
  </div>
);

// Decorative background star positions [x, y, radius, opacity]
const BACKGROUND_STARS: [number, number, number, number][] = [
  [8, 12, 0.3, 0.25], [15, 88, 0.25, 0.2], [92, 8, 0.3, 0.3],
  [88, 90, 0.25, 0.22], [5, 50, 0.2, 0.18], [95, 45, 0.3, 0.25],
  [50, 5, 0.2, 0.2], [48, 95, 0.25, 0.18], [22, 5, 0.2, 0.22],
  [75, 10, 0.25, 0.2], [10, 70, 0.2, 0.18], [90, 72, 0.3, 0.25],
  [30, 92, 0.2, 0.18], [70, 95, 0.25, 0.2], [3, 30, 0.2, 0.2],
  [97, 25, 0.25, 0.22], [38, 3, 0.2, 0.18], [62, 97, 0.2, 0.2],
  [18, 18, 0.15, 0.15], [82, 80, 0.15, 0.15], [5, 82, 0.2, 0.2],
  [93, 55, 0.15, 0.18], [60, 3, 0.2, 0.15], [12, 42, 0.15, 0.15],
];
