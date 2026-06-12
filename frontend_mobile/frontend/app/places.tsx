import { Redirect } from "expo-router";

export default function PlacesRedirect() {
  return <Redirect href={{ pathname: "/(tabs)/fleet", params: { tab: "places" } }} />;
}
