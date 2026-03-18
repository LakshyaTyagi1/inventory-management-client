import type { AuthSession, AuthUser } from "@/types";

const authStorageKey = "inventory-auth-session";
export const authExpiredEventName = "inventory-auth-expired";

type StoredAuthUser = Partial<
  AuthUser & {
    email_id: string;
    first_name: string;
    last_name: string;
    user_access: string;
    company_id: string;
  }
> & {
  _id?: unknown;
  company?: unknown;
};

type StoredAuthSession = {
  token?: unknown;
  user?: StoredAuthUser | null;
};

function canUseSessionStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeStoredAuthUser(
  user: StoredAuthUser | null | undefined,
): AuthUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const emailId = user.emailId ?? user.email_id;
  const firstName = user.firstName ?? user.first_name;
  const lastName = user.lastName ?? user.last_name;
  const userAccess = user.userAccess ?? user.user_access;
  const companyId = user.companyId ?? user.company_id;

  if (
    !isString(user._id) ||
    !isString(emailId) ||
    !isString(firstName) ||
    !isString(lastName) ||
    !isString(userAccess)
  ) {
    return null;
  }

  return {
    _id: user._id,
    emailId,
    firstName,
    lastName,
    userAccess,
    ...(isString(user.company) ? { company: user.company } : {}),
    ...(isString(companyId) ? { companyId } : {}),
  };
}

function normalizeStoredAuthSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const session = value as StoredAuthSession;
  if (!isString(session.token)) {
    return null;
  }

  const user = normalizeStoredAuthUser(session.user);
  if (!user) {
    return null;
  }

  return {
    token: session.token,
    user,
  };
}

function getSessionStorageItem(key: string): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionStorageItem(key: string, value: string): void {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

function removeSessionStorageItem(key: string): void {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    sessionStorage.removeItem(key);
  } catch {
    return;
  }
}

export function getStoredAuthSession(): AuthSession | null {
  const raw = getSessionStorageItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const session = normalizeStoredAuthSession(JSON.parse(raw));
    if (!session) {
      removeSessionStorageItem(authStorageKey);
    }

    return session;
  } catch {
    removeSessionStorageItem(authStorageKey);
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession): void {
  setSessionStorageItem(authStorageKey, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  removeSessionStorageItem(authStorageKey);
}

export function getAccessToken(): string | null {
  return getStoredAuthSession()?.token ?? null;
}

export function dispatchAuthExpired(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(authExpiredEventName));
}
