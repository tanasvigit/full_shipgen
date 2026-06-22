import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

/** Matches web `LogoLoader.jsx` (512×320 viewBox). */
const VIEW_W = 512;
const VIEW_H = 320;
const WIDTH_RATIO = 1.62;

const CLIPS = {
  streaks: { x: 4, y: 68, w: 228, h: 132 },
  swoosh: { x: 0, y: 198, w: VIEW_W, h: VIEW_H - 198 },
  mark: { x: 188, y: 8, w: VIEW_W - 188, h: 202 },
} as const;

const LOGO = require("@/assets/images/shipgen-icon.png");

type Props = {
  size?: number;
};

type ClipLayerProps = {
  clip: (typeof CLIPS)[keyof typeof CLIPS];
  width: number;
  height: number;
  scale: number;
  zIndex: number;
  animated?: boolean;
  translateX?: Animated.Value;
  scaleX?: Animated.Value;
  opacity?: Animated.Value;
};

function ClipLayer({
  clip,
  width,
  height,
  scale,
  zIndex,
  animated = false,
  translateX,
  scaleX,
  opacity,
}: ClipLayerProps) {
  const imageStyle = {
    width,
    height,
    position: "absolute" as const,
    left: -clip.x * scale,
    top: -clip.y * scale,
  };

  return (
    <View
      style={[
        styles.clip,
        {
          left: clip.x * scale,
          top: clip.y * scale,
          width: clip.w * scale,
          height: clip.h * scale,
          zIndex,
        },
      ]}
    >
      {animated ? (
        <Animated.Image
          source={LOGO}
          resizeMode="stretch"
          style={[
            imageStyle,
            {
              opacity: opacity ?? 1,
              transform: [{ translateX: translateX ?? 0 }, { scaleX: scaleX ?? 1 }],
            },
          ]}
        />
      ) : (
        <Image source={LOGO} resizeMode="stretch" style={imageStyle} />
      )}
    </View>
  );
}

export default function ShipgenLogoLoader({ size = 84 }: Props) {
  const height = size;
  const width = Math.round(height * WIDTH_RATIO);
  const scale = height / VIEW_H;

  const fade = useRef(new Animated.Value(0)).current;
  const streakX = useRef(new Animated.Value(-14)).current;
  const streakOpacity = useRef(new Animated.Value(0.45)).current;
  const swooshX = useRef(new Animated.Value(-10)).current;
  const swooshScaleX = useRef(new Animated.Value(0.98)).current;
  const swooshOpacity = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const streakLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(streakX, {
            toValue: 16,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(streakOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(streakX, {
            toValue: -14,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(streakOpacity, {
            toValue: 0.45,
            duration: 450,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const swooshLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(swooshX, {
            toValue: 18,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swooshScaleX, {
            toValue: 1.02,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swooshOpacity, {
            toValue: 1,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(swooshX, {
            toValue: -10,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swooshScaleX, {
            toValue: 0.98,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(swooshOpacity, {
            toValue: 0.82,
            duration: 525,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    streakLoop.start();
    swooshLoop.start();

    return () => {
      streakLoop.stop();
      swooshLoop.stop();
    };
  }, [fade, streakOpacity, streakX, swooshOpacity, swooshScaleX, swooshX]);

  return (
    <Animated.View style={[styles.frame, { width, height, opacity: fade }]}>
      <ClipLayer
        clip={CLIPS.swoosh}
        width={width}
        height={height}
        scale={scale}
        zIndex={1}
        animated
        translateX={swooshX}
        scaleX={swooshScaleX}
        opacity={swooshOpacity}
      />
      <ClipLayer
        clip={CLIPS.streaks}
        width={width}
        height={height}
        scale={scale}
        zIndex={2}
        animated
        translateX={streakX}
        opacity={streakOpacity}
      />
      <ClipLayer clip={CLIPS.mark} width={width} height={height} scale={scale} zIndex={3} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
  },
  clip: {
    position: "absolute",
    overflow: "hidden",
  },
});
