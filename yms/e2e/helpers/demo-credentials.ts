export const YMS_DEMO_PASSWORD = "Shipgen@Yms2026!";

export const YMS_DEMO_USERS = {
  yard_admin: { email: "yard.admin@shipgen.demo", password: YMS_DEMO_PASSWORD },
  yard_manager: { email: "yard.manager@shipgen.demo", password: YMS_DEMO_PASSWORD },
  gate_operator: { email: "yard.gate@shipgen.demo", password: YMS_DEMO_PASSWORD },
  yard_coordinator: { email: "yard.coordinator@shipgen.demo", password: YMS_DEMO_PASSWORD },
  dock_supervisor: { email: "yard.supervisor@shipgen.demo", password: YMS_DEMO_PASSWORD },
} as const;

export async function fillYmsLoginForm(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
}
