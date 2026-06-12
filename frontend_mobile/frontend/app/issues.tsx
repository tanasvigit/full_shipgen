import { Redirect } from "expo-router";

export default function IssuesRedirect() {
  return <Redirect href={{ pathname: "/(tabs)/fleet", params: { tab: "issues" } }} />;
}
