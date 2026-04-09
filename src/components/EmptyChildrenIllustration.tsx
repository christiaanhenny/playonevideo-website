import React from 'react';
import Svg, { Circle, Rect, Path, G, Ellipse, Line } from 'react-native-svg';

export function EmptyChildrenIllustration({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">

      {/* ── Background circles ── */}
      <Circle cx={100} cy={105} r={88} fill="#EBEBEB" />
      <Circle cx={100} cy={105} r={72} fill="#F4F4F4" />

      {/* ══════════════════════════════
          PHONE (center, smaller)
      ══════════════════════════════ */}
      <Rect x={78} y={90} width={44} height={68} rx={8} fill="#D0D0D0" />
      <Rect x={83} y={97} width={34} height={50} rx={4} fill="#F2F2F2" />
      {/* play button on screen */}
      <Path d="M96 116 L96 128 L108 122 Z" fill="#B0B0B0" />
      {/* home dot */}
      <Circle cx={100} cy={153} r={3} fill="#B8B8B8" />

      {/* ══════════════════════════════
          LEFT CHILD (girl)
      ══════════════════════════════ */}
      <G>
        {/* Head */}
        <Circle cx={52} cy={62} r={20} fill="#C0C0C0" />
        {/* Hair — two buns */}
        <Circle cx={36} cy={50} r={8} fill="#AAAAAA" />
        <Circle cx={68} cy={50} r={8} fill="#AAAAAA" />
        {/* Neck */}
        <Rect x={47} y={80} width={10} height={8} rx={3} fill="#BCBCBC" />
        {/* Body / dress */}
        <Path d="M34 88 Q52 84 70 88 L74 130 Q52 136 30 130 Z" fill="#C8C8C8" />
        {/* Left arm */}
        <Path d="M36 94 Q22 105 18 118" stroke="#C0C0C0" strokeWidth={9} strokeLinecap="round" fill="none" />
        {/* Right arm — reaching toward phone */}
        <Path d="M68 94 Q78 108 82 114" stroke="#C0C0C0" strokeWidth={9} strokeLinecap="round" fill="none" />
        {/* Left leg */}
        <Path d="M42 128 Q40 148 38 164" stroke="#BCBCBC" strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* Right leg */}
        <Path d="M62 128 Q64 148 66 164" stroke="#BCBCBC" strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* Shoes */}
        <Ellipse cx={36} cy={165} rx={9} ry={5} fill="#ADADAD" />
        <Ellipse cx={67} cy={165} rx={9} ry={5} fill="#ADADAD" />
      </G>

      {/* ══════════════════════════════
          RIGHT CHILD (boy)
      ══════════════════════════════ */}
      <G>
        {/* Head */}
        <Circle cx={150} cy={58} r={22} fill="#B0B0B0" />
        {/* Hair — flat top */}
        <Rect x={129} y={38} width={42} height={10} rx={5} fill="#9A9A9A" />
        {/* Neck */}
        <Rect x={145} y={78} width={10} height={8} rx={3} fill="#ACACAC" />
        {/* Body */}
        <Path d="M130 86 Q150 82 170 86 L172 128 Q150 134 128 128 Z" fill="#BABABA" />
        {/* Left arm — reaching toward phone */}
        <Path d="M132 92 Q120 108 118 116" stroke="#B4B4B4" strokeWidth={9} strokeLinecap="round" fill="none" />
        {/* Right arm */}
        <Path d="M168 92 Q180 104 184 118" stroke="#B4B4B4" strokeWidth={9} strokeLinecap="round" fill="none" />
        {/* Left leg */}
        <Path d="M138 126 Q136 146 134 163" stroke="#AEAEAE" strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* Right leg */}
        <Path d="M158 126 Q160 146 163 163" stroke="#AEAEAE" strokeWidth={10} strokeLinecap="round" fill="none" />
        {/* Shoes */}
        <Ellipse cx={133} cy={165} rx={10} ry={5} fill="#9E9E9E" />
        <Ellipse cx={164} cy={165} rx={10} ry={5} fill="#9E9E9E" />
      </G>

      {/* ── Decorative dots ── */}
      <Circle cx={100} cy={30} r={3} fill="#D8D8D8" />
      <Circle cx={24} cy={130} r={3} fill="#D4D4D4" />
      <Circle cx={178} cy={125} r={3} fill="#D0D0D0" />

    </Svg>
  );
}
