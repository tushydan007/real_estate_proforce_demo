import { store } from "../redux/store";
import { setUser, clearUser } from "../redux/features/auth/authSlice";
import type { User } from "../redux/features/auth/authSlice";

const TOKEN_KEY = "auth_token";

export function saveAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function saveUser(user: User | null) {
  store.dispatch(setUser(user));
}

export function clearUserData() {
  store.dispatch(clearUser());
}