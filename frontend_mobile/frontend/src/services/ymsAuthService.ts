import {
  getStoredYardSession,
  setStoredYardSession,
  ymsRequest,
} from "@/src/lib/ymsApi";

export type YardUser = {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
};

type AuthMeResponse = {
  user_id: string;
  username: string;
  display_name?: string;
  role: string;
  permissions: string[];
};

function mapMe(me: AuthMeResponse): YardUser {
  return {
    userId: me.user_id,
    username: me.username,
    displayName: me.display_name || me.username,
    role: me.role,
    permissions: me.permissions || [],
  };
}

export const ymsAuthService = {
  async clearLocalSession() {
    await setStoredYardSession(null);
  },

  async login(identity: string, password: string) {
    const data = await ymsRequest<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { identity: identity.trim(), password },
    });
    await setStoredYardSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    return this.bootstrap();
  },

  async bootstrap() {
    const session = await getStoredYardSession();
    if (!session?.accessToken) {
      return { session: null, me: null };
    }
    const me = await ymsRequest<AuthMeResponse>("/auth/me");
    return { session, me: mapMe(me) };
  },

  async logout(options: { notifyServer?: boolean } = {}) {
    const notifyServer = options.notifyServer !== false;
    const session = await getStoredYardSession();
    if (notifyServer && session?.refreshToken) {
      try {
        await ymsRequest("/auth/logout", {
          method: "POST",
          body: { refresh_token: session.refreshToken },
        });
      } catch {
        // best-effort
      }
    }
    await ymsAuthService.clearLocalSession();
  },
};
