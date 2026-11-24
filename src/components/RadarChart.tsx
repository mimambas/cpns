import React from 'react';

export interface RadarAxisPoint {
  id: string;
  label: string;
  value: number;
  tested: boolean;
  detailText: string;
}

interface RadarChartProps {
  axes: RadarAxisPoint[];
  targetValue?: number;
  selectedId: string | null;
  onSelectAxis: (id: string) => void;
  ariaLabel: string;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: Number((cx + radius * Math.cos(angleRad)).toFixed(2)),
    y: Number((cy + radius * Math.sin(angleRad)).toFixed(2)),
  };
}

function getPointColor(value: number, tested: boolean): string {
  if (!tested) return '#94a3b8';
  if (value < 60) return '#d32f2f';
  if (value < 80) return '#d97706';
  return '#1868db';
}

export const RadarChart: React.FC<RadarChartProps> = ({
  axes,
  targetValue = 75,
  selectedId,
  onSelectAxis,
  ariaLabel,
}) => {
  const width = 420;
  const height = 316;
  const cx = 210;
  const cy = 158;
  const maxRadius = 92;
  const levels = [25, 50, 75, 100];
  const count = Math.max(3, axes.length);

  const angles = axes.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / count);

  const levelPolygons = levels.map((lvl) => {
    const r = (lvl / 100) * maxRadius;
    const pts = angles
      .map((a) => {
        const p = polarToCartesian(cx, cy, r, a);
        return `${p.x},${p.y}`;
      })
      .join(' ');
    return { lvl, pts };
  });

  const targetRadius = (Math.max(0, Math.min(100, targetValue)) / 100) * maxRadius;
  const targetPolygonPts = angles
    .map((a) => {
      const p = polarToCartesian(cx, cy, targetRadius, a);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  const scorePoints = axes.map((axis, i) => {
    const clamped = axis.tested ? Math.max(6, Math.min(100, axis.value)) : 0;
    const r = (clamped / 100) * maxRadius;
    return polarToCartesian(cx, cy, r, angles[i]);
  });

  const hasTestedAny = axes.some((a) => a.tested);
  const scorePolygonPts = scorePoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="radar-svg-wrap">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="radar-svg"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Concentric grid polygons */}
        {levelPolygons.map(({ lvl, pts }) => (
          <polygon
            key={lvl}
            points={pts}
            fill={lvl === 100 ? 'rgba(24, 104, 219, 0.02)' : 'none'}
            stroke="#e2e8f0"
            strokeWidth={lvl === 100 ? 1.25 : 1}
          />
        ))}

        {/* Radial spoke lines */}
        {angles.map((angle, idx) => {
          const end = polarToCartesian(cx, cy, maxRadius, angle);
          return (
            <line
              key={axes[idx]?.id ?? idx}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        {/* Scale ring markers along top vertical axis */}
        {levels.map((lvl) => {
          const y = cy - (lvl / 100) * maxRadius;
          return (
            <text
              key={`lbl-${lvl}`}
              x={cx + 4}
              y={y - 3}
              fontSize="9.5"
              fill="#64748b"
              fontFamily="var(--font-mono)"
            >
              {lvl}%
            </text>
          );
        })}

        {/* Dashed safe target benchmark polygon (e.g. 75%) */}
        <polygon
          points={targetPolygonPts}
          fill="none"
          stroke="#64748b"
          strokeWidth={1.35}
          strokeDasharray="4 4"
        />

        {/* User mastery polygon */}
        {hasTestedAny && (
          <polygon
            points={scorePolygonPts}
            fill="rgba(24, 104, 219, 0.18)"
            stroke="#1868db"
            strokeWidth={2.25}
            strokeLinejoin="round"
          />
        )}

        {/* Interactive vertices & axis labels */}
        {axes.map((axis, i) => {
          const angle = angles[i];
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const labelPos = polarToCartesian(cx, cy, maxRadius + 24, angle);
          const pt = scorePoints[i];
          const isSelected = axis.id === selectedId;
          const color = getPointColor(axis.value, axis.tested);

          const textAnchor =
            Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          const dyBase = sin > 0.45 ? 10 : sin < -0.45 ? -4 : 3;

          return (
            <g
              key={axis.id}
              className="radar-axis-group"
              onClick={() => onSelectAxis(axis.id)}
            >
              {isSelected && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={9}
                  fill="rgba(24, 104, 219, 0.14)"
                  stroke="#1868db"
                  strokeWidth={1.5}
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 5.5 : 4.5}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y + dyBase}
                textAnchor={textAnchor}
                fontSize="11.5"
                fontWeight={isSelected ? '600' : '500'}
                fill={isSelected ? '#1868db' : '#1e293b'}
                className="radar-axis-label"
              >
                {axis.label}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + dyBase + 13}
                textAnchor={textAnchor}
                fontSize="10.5"
                fontFamily="var(--font-mono)"
                fill={color}
                className="radar-axis-label"
              >
                {axis.detailText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
