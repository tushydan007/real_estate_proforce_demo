import type { User } from "@/types";

const USER_KEY = "user";

// Save user (or clear if null)
export function saveUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

// Get user from localStorage
export function getUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as User;
  } catch (err) {
    console.error("Failed to parse stored user:", err);
    return null;
  }
}

// Clear user explicitly
export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}
