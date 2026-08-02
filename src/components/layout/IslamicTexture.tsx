/**
 * IslamicTexture.tsx
 *
 * A reusable Islamic geometric/arabesque background texture rendered
 * with react-native-svg.  It tiles a star-and-hexagon motif that is
 * classic in Islamic art, then overlays a radial gradient veil so the
 * pattern never competes with content.
 *
 * Usage:
 *   <IslamicTexture opacity={0.07} tint="light" />   ← light screens
 *   <IslamicTexture opacity={0.09} tint="dark"  />   ← dark screens
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Pattern,
  Path,
  Rect,
  RadialGradient,
  Stop,
  Line,
  Circle,
  G,
  Polygon,
} from 'react-native-svg';

interface IslamicTextureProps {
  /** Overall opacity of the texture layer (0–1). Default 0.07 */
  opacity?: number;
  /** Whether to use a light or dark stroke colour */
  tint?: 'light' | 'dark' | 'gold';
  /** Covers parent absolutely; defaults to true */
  absolute?: boolean;
}

// ── Tile size (the pattern repeats at this pitch) ─────────────────────────────
const TILE = 72;

/**
 * Builds the SVG <path> d-string for one classic 8-pointed Islamic star
 * centered at (cx, cy) with outer radius R and inner radius r.
 */
function star8Path(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return `M${pts.join(' L')}Z`;
}

/**
 * Regular hexagon path centered at (cx, cy) with radius R.
 */
function hexPath(cx: number, cy: number, R: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`);
  }
  return `M${pts.join(' L')}Z`;
}

export const IslamicTexture: React.FC<IslamicTextureProps> = ({
  opacity = 0.07,
  tint = 'dark',
  absolute = true,
}) => {
  const stroke =
    tint === 'gold' ? '#D4AF37' : tint === 'light' ? '#FFFFFF' : '#FFFFFF';

  const T = TILE;
  const H = T / 2;

  // Star params
  const starR = 14;
  const starR2 = 6;

  // Hexagon params
  const hexR = 11;

  const patternId = `ip_${tint}`;
  const gradId = `ig_${tint}`;

  return (
    <View
      style={[
        styles.base,
        absolute && StyleSheet.absoluteFillObject,
        { opacity },
      ]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/* ── Repeating tile pattern ─────────────────────────────── */}
          <Pattern
            id={patternId}
            x="0"
            y="0"
            width={T}
            height={T}
            patternUnits="userSpaceOnUse"
          >
            {/* Background of tile — transparent */}
            <Rect width={T} height={T} fill="none" />

            {/* ── Centre star at (H, H) ──────────────────────────── */}
            <Path
              d={star8Path(H, H, starR, starR2)}
              fill="none"
              stroke={stroke}
              strokeWidth="1.2"
            />

            {/* ── Corner stars (quarter each at tile corners) ──────── */}
            <Path
              d={star8Path(0, 0, starR, starR2)}
              fill="none"
              stroke={stroke}
              strokeWidth="1.2"
            />
            <Path
              d={star8Path(T, 0, starR, starR2)}
              fill="none"
              stroke={stroke}
              strokeWidth="1.2"
            />
            <Path
              d={star8Path(0, T, starR, starR2)}
              fill="none"
              stroke={stroke}
              strokeWidth="1.2"
            />
            <Path
              d={star8Path(T, T, starR, starR2)}
              fill="none"
              stroke={stroke}
              strokeWidth="1.2"
            />

            {/* ── Hexagons at mid-edges ─────────────────────────────── */}
            <Path
              d={hexPath(H, 0, hexR)}
              fill="none"
              stroke={stroke}
              strokeWidth="0.9"
            />
            <Path
              d={hexPath(H, T, hexR)}
              fill="none"
              stroke={stroke}
              strokeWidth="0.9"
            />
            <Path
              d={hexPath(0, H, hexR)}
              fill="none"
              stroke={stroke}
              strokeWidth="0.9"
            />
            <Path
              d={hexPath(T, H, hexR)}
              fill="none"
              stroke={stroke}
              strokeWidth="0.9"
            />

            {/* ── Diagonal connecting lines ─────────────────────────── */}
            <Line
              x1={H - starR}
              y1={H - starR}
              x2={starR}
              y2={starR}
              stroke={stroke}
              strokeWidth="0.7"
              opacity="0.7"
            />
            <Line
              x1={H + starR}
              y1={H - starR}
              x2={T - starR}
              y2={starR}
              stroke={stroke}
              strokeWidth="0.7"
              opacity="0.7"
            />
            <Line
              x1={H - starR}
              y1={H + starR}
              x2={starR}
              y2={T - starR}
              stroke={stroke}
              strokeWidth="0.7"
              opacity="0.7"
            />
            <Line
              x1={H + starR}
              y1={H + starR}
              x2={T - starR}
              y2={T - starR}
              stroke={stroke}
              strokeWidth="0.7"
              opacity="0.7"
            />

            {/* ── Subtle dot at centre ──────────────────────────────── */}
            <Circle
              cx={H}
              cy={H}
              r={2}
              fill={stroke}
              opacity="0.8"
            />
          </Pattern>

          {/* ── Radial gradient veil — fades texture at edges ─────── */}
          <RadialGradient id={gradId} cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="black" stopOpacity="0" />
            <Stop offset="100%" stopColor="black" stopOpacity="0.7" />
          </RadialGradient>
        </Defs>

        {/* Tile the whole canvas */}
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />

        {/* Veil — softens edges so texture stays subtle */}
        <Rect
          width="100%"
          height="100%"
          fill={`url(#${gradId})`}
          opacity="0.4"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    zIndex: 1,
  },
});
