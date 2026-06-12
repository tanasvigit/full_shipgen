import { Redirect } from "expo-router";

export default function DriversRedirect() {
  return <Redirect href={{ pathname: "/(tabs)/fleet", params: { tab: "drivers" } }} />;
}
