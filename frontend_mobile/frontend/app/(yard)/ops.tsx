import { Redirect } from "expo-router";

/** Legacy ops route — Phase F moved the hub to the More tab. */
export default function YardOpsScreen() {
  return <Redirect href="/(yard)/more" />;
}
