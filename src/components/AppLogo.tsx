import React from 'react';
import Svg, { Rect, Polygon, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants';

type Props = {
  size?: number;
};

/**
 * AppLogo — play-knop icoon met een "1" erin.
 * Afrondingen, donkere achtergrond, witte elementen.
 */
export function AppLogo({ size = 40 }: Props) {
  const r = size * 0.26; // corner radius

  // Play triangle punten (gecentreerd, iets naar rechts voor optische balans)
  const cx = size * 0.54;
  const cy = size * 0.5;
  const tw = size * 0.22; // halve breedte
  const th = size * 0.26; // halve hoogte
  const tri = `${cx - tw * 0.6},${cy - th} ${cx + tw},${cy} ${cx - tw * 0.6},${cy + th}`;

  // "1" positie — links van de play knop
  const oneX = size * 0.26;
  const oneY = size * 0.645;
  const fontSize = size * 0.38;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Achtergrond */}
      <Rect
        x={0}
        y={0}
        width={size}
        height={size}
        rx={r}
        ry={r}
        fill={COLORS.primaryDark}
      />
      {/* "1" */}
      <SvgText
        x={oneX}
        y={oneY}
        fontSize={fontSize}
        fontWeight="800"
        fill="#fff"
        textAnchor="middle"
        letterSpacing={-1}
      >
        1
      </SvgText>
      {/* Play driehoek */}
      <Polygon
        points={tri}
        fill="#fff"
      />
    </Svg>
  );
}
