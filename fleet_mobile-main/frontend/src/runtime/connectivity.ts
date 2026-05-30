import { refreshNetworkState } from "@/src/offline/network";

export { refreshNetworkState, subscribeNetwork, getNetworkOnline } from "@/src/offline/network";

export async function initConnectivity() {
  await refreshNetworkState();
}
