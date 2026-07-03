import { ReactNode, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { usePathname, useRouter, type Href } from "expo-router";

type Props = {
  /** Route group segment, e.g. "(tabs)" or "(yard)". */
  group: string;
  /** Ordered visible tab route names, matching the tab bar display order. */
  routes: string[];
  children: ReactNode;
};

// A swipe must be either a clear fling (velocity) or a long-enough drag.
const SWIPE_DISTANCE = 64;
const SWIPE_VELOCITY = 520;

/**
 * Wraps a bottom-tab navigator and switches to the adjacent tab on a
 * horizontal swipe. Vertical scrolls and near-vertical drags are ignored so
 * lists keep scrolling normally.
 */
export default function SwipeTabsHost({ group, routes, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Keep the latest values reachable from the gesture callback.
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const goRelative = (direction: 1 | -1) => {
    const list = routesRef.current;
    if (list.length < 2) return;
    const current = (pathnameRef.current || "").split("/").filter(Boolean).pop() || "";
    const index = list.indexOf(current);
    if (index === -1) return;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    router.navigate(`/${group}/${list[target]}` as Href);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-22, 22])
    .onEnd((e) => {
      const farEnough = Math.abs(e.translationX) > SWIPE_DISTANCE;
      const fastEnough = Math.abs(e.velocityX) > SWIPE_VELOCITY;
      if (!farEnough && !fastEnough) return;
      // Swipe left (negative X) advances to the next tab; swipe right goes back.
      goRelative(e.translationX < 0 ? 1 : -1);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
