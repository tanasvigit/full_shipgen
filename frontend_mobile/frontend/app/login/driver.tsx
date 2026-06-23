import { Redirect } from "expo-router";

/** Legacy route — unified login lives at /login */
export default function DriverLoginScreen() {
  return <Redirect href="/login" />;
}
