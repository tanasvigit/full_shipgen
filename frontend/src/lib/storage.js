const AUTH_KEY = "fleetbase.frontend.auth";
const ORG_KEY = "fleetbase.frontend.organization";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const authStorage = {
  get() {
    if (typeof window === "undefined") return null;
    return safeParse(window.localStorage.getItem(AUTH_KEY));
  },
  set(value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(value));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(AUTH_KEY);
  },
};

export const orgStorage = {
  get() {
    if (typeof window === "undefined") return null;
    return safeParse(window.localStorage.getItem(ORG_KEY));
  },
  set(value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ORG_KEY, JSON.stringify(value));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ORG_KEY);
  },
};
