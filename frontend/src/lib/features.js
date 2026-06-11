/** Feature flags — set `VITE_TWO_FA_ENABLED=true` in .env to expose 2FA settings UI. */
export const features = {
  twoFaEnabled: import.meta.env.VITE_TWO_FA_ENABLED === "true",
};
