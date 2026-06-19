import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type OnboardingStarsProps = {
  width: number;
  height: number;
};

/** 4-point sparkle path centered at (cx, cy) with outer radius s. */
const sparkle = (cx: number, cy: number, s: number) => {
  const i = s * 0.22;
  return `M ${cx} ${cy - s} L ${cx + i} ${cy - i} L ${cx + s} ${cy} L ${cx + i} ${cy + i} L ${cx} ${cy + s} L ${cx - i} ${cy + i} L ${cx - s} ${cy} L ${cx - i} ${cy - i} Z`;
};

// positions as fractions of width/height; y kept <= 0.76 to avoid the cut line
const SPARKLES = [
  { x: 0.1, y: 0.09, s: 9, o: 0.95 },
  { x: 0.9, y: 0.13, s: 7, o: 0.85 },
  { x: 0.14, y: 0.44, s: 11, o: 1 },
  { x: 0.88, y: 0.38, s: 6, o: 0.8 },
  { x: 0.11, y: 0.71, s: 9, o: 0.9 },
  { x: 0.85, y: 0.66, s: 6, o: 0.8 },
];

const DOTS = [
  { x: 0.29, y: 0.19, r: 2.6, o: 0.7 },
  { x: 0.74, y: 0.28, r: 2, o: 0.6 },
  { x: 0.93, y: 0.52, r: 2.6, o: 0.7 },
  { x: 0.2, y: 0.6, r: 2, o: 0.55 },
  { x: 0.66, y: 0.74, r: 2, o: 0.6 },
  { x: 0.55, y: 0.1, r: 1.6, o: 0.5 },
];

const OnboardingStars = ({ width, height }: OnboardingStarsProps) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {SPARKLES.map((p, idx) => (
          <Path
            key={`s${idx}`}
            d={sparkle(p.x * width, p.y * height, p.s)}
            fill="#FFFFFF"
            opacity={p.o}
          />
        ))}
        {DOTS.map((p, idx) => (
          <Circle
            key={`d${idx}`}
            cx={p.x * width}
            cy={p.y * height}
            r={p.r}
            fill="#FFFFFF"
            opacity={p.o}
          />
        ))}
      </Svg>
    </View>
  );
};

export default OnboardingStars;
