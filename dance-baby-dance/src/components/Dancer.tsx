import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type Props = {
  color: string;
  /** Width in px. Height is 1.25 times the width. */
  size?: number;
  playing: boolean;
  delayMs?: number;
  opacity?: number;
};

const W = 120;
const H = 150;
const STROKE = 7;

type LimbProps = {
  x: number;
  y: number;
  length: number;
  k: number;
  color: string;
  rotate?: Animated.AnimatedInterpolation<string>;
};

/** A rounded bar that hangs down from a pivot point and rotates around its top edge. */
function Limb({ x, y, length, k, color, rotate }: LimbProps) {
  const len = length * k;
  const w = STROKE * k;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * k - w / 2,
        top: y * k,
        width: w,
        height: len,
        borderRadius: w / 2,
        backgroundColor: color,
        transform: rotate
          ? [{ translateY: -len / 2 }, { rotate }, { translateY: len / 2 }]
          : [],
      }}
    />
  );
}

/** Animated stick-figure placeholder used until a clip has real video. */
export function Dancer({ color, size = 120, playing, delayMs = 0, opacity = 1 }: Props) {
  const phase = useRef(new Animated.Value(0)).current;
  const k = size / W;

  useEffect(() => {
    if (!playing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(phase, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(phase, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const timer = setTimeout(() => loop.start(), delayMs);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [playing, delayMs, phase]);

  const armL = phase.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '135deg'] });
  const armR = phase.interpolate({ inputRange: [0, 1], outputRange: ['-135deg', '-45deg'] });
  const legL = phase.interpolate({ inputRange: [0, 1], outputRange: ['6deg', '-8deg'] });
  const legR = phase.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '6deg'] });
  const bob = phase.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * k] });

  return (
    <Animated.View
      style={{ width: W * k, height: H * k, opacity, transform: [{ translateY: bob }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          position: 'absolute',
          left: 48 * k,
          top: 12 * k,
          width: 24 * k,
          height: 24 * k,
          borderRadius: 12 * k,
          backgroundColor: color,
        }}
      />
      <Limb x={60} y={36} length={48} k={k} color={color} />
      <Limb x={60} y={48} length={38} k={k} color={color} rotate={armL} />
      <Limb x={60} y={48} length={38} k={k} color={color} rotate={armR} />
      <Limb x={60} y={84} length={46} k={k} color={color} rotate={legL} />
      <Limb x={60} y={84} length={46} k={k} color={color} rotate={legR} />
    </Animated.View>
  );
}
