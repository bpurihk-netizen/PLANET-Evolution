import React from 'react';
import { getConstellationArt } from '../data/constellationArt';

interface ConstellationSilhouetteProps {
  constellationId: string;
  accentColor?: string;
  /** Width/height of the SVG element (square). Default 200 */
  size?: number;
  className?: string;
}

export const ConstellationSilhouette: React.FC<ConstellationSilhouetteProps> = ({
  constellationId,
  accentColor = '#7eb8ff',
  size = 200,
  className,
}) => {
  const art = getConstellationArt(constellationId);

  // Derive glow / muted colors from the accent
  const starColor = accentColor;
  const lineColor = accentColor;
  const silhouetteColor = accentColor;

  const id = `cs-${constellationId}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        {/* Radial background */}
        <radialGradient id={`${id}-bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
        </radialGradient>

        {/* Star glow */}
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle silhouette glow */}
        <filter id={`${id}-sfx`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background radial glow */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-bg)`} />

      {/* Tiny background star field */}
      {BACKGROUND_STARS.map((s, i) => (
        <circle
          key={i}
          cx={s[0]}
          cy={s[1]}
          r={s[2]}
          fill="white"
          opacity={s[3]}
        />
      ))}

      {/* Mythological silhouette (behind lines) */}
      {art.silhouette && (
        <path
          d={art.silhouette}
          fill={silhouetteColor}
          opacity={0.06}
          filter={`url(#${id}-sfx)`}
        />
      )}

      {/* Constellation lines */}
      {art.lines.map(([a, b], i) => {
        const [x1, y1] = art.stars[a];
        const [x2, y2] = art.stars[b];
        return (
          <line
            key={i}
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={lineColor}
            strokeWidth="0.6"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
        );
      })}

      {/* Stars */}
      {art.stars.map(([x, y], i) => (
        <g key={i} filter={`url(#${id}-glow)`}>
          {/* Outer glow ring */}
          <circle cx={x} cy={y} r={2.2} fill={starColor} opacity={0.18} />
          {/* Core */}
          <circle cx={x} cy={y} r={1.1} fill={starColor} opacity={0.9} />
          {/* Hot center */}
          <circle cx={x} cy={y} r={0.45} fill="white" opacity={0.95} />
        </g>
      ))}
    </svg>
  );
};

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
