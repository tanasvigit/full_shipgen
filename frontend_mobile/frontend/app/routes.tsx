import { Redirect } from "expo-router";

export default function RoutesRedirect() {
  return <Redirect href={{ pathname: "/(tabs)/fleet", params: { tab: "routes" } }} />;
}
