import { useCallback } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { useYardMoreFlow } from "@/src/contexts/YardMoreFlowContext";
import { returnToMoreHub, shouldReturnToMoreHub } from "@/src/lib/yardModuleNavigation";

/** Intercepts Android back while browsing modules opened from the More hub. */
export function useYardMoreBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { inMoreFlow } = useYardMoreFlow();

  useFocusEffect(
    useCallback(() => {
      if (!shouldReturnToMoreHub(pathname, inMoreFlow)) {
        return undefined;
      }

      const onBackPress = () => {
        returnToMoreHub(router);
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [pathname, inMoreFlow, router]),
  );
}
