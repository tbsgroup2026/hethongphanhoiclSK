import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";

const STORAGE_KEY = "tbs-htph-clsk-auth";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (employeeCode: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToken(parsed.token);
        setUser(parsed.user);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    registerForPushNotificationsAsync().then((pushToken) => {
      if (pushToken) api.registerPushToken(token, pushToken).catch(() => {});
    });
  }, [token]);

  async function login(employeeCode: string, password: string) {
    const res = await api.login(employeeCode, password);
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(res));
  }

  async function logout() {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function refreshUser() {
    if (!token) return;
    const freshUser = await api.me(token);
    setUser(freshUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: freshUser }));
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
