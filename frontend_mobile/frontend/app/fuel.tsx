import { Redirect } from "expo-router";

export default function FuelRedirect() {
  return <Redirect href={{ pathname: "/(tabs)/fleet", params: { tab: "fuel" } }} />;
}
