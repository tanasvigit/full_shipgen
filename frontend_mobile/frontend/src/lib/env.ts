const trimSlash = (value: string) => value.replace(/\/+$/, "");

const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/int/v1";
const apiHost = trimSlash(apiBase.replace(/\/int\/v1\/?$/, ""));

export const env = {
  API_BASE_URL: trimSlash(apiBase),
  API_HOST: apiHost,
  YMS_API_BASE_URL: trimSlash(process.env.EXPO_PUBLIC_YMS_API_BASE_URL ?? `${apiHost}/api/yms`),
};
