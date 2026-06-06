import NetInfo from "@react-native-community/netinfo";

let online = true;

export function getNetworkOnline() {
  return online;
}

export async function refreshNetworkState() {
  const state = await NetInfo.fetch();
  online = Boolean(state.isConnected && state.isInternetReachable !== false);
  return online;
}

export function subscribeNetwork(listener: (isOnline: boolean) => void) {
  return NetInfo.addEventListener((state) => {
    const next = Boolean(state.isConnected && state.isInternetReachable !== false);
    online = next;
    listener(next);
  });
}
