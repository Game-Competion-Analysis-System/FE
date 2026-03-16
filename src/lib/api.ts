import axios, { AxiosError, type AxiosRequestConfig } from "axios";

const AUTH_TOKEN_KEY = "auth.token";
const AUTH_USER_KEY = "auth.user";
const AUTH_CHANGED_EVENT = "auth:changed";

function getApiBaseUrl() {
  const fromEnv = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : "/api";
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  return { ...(headers as Record<string, string>) };
}

export function getAuthToken() {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    const cleaned = raw.replace(/[\r\n]+/g, "").trim();
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

export function getAuthUser(): any | null {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } else {
      const cleaned = token.replace(/[\r\n]+/g, "").trim();
      if (cleaned.length === 0) localStorage.removeItem(AUTH_TOKEN_KEY);
      else localStorage.setItem(AUTH_TOKEN_KEY, cleaned);
    }
  } catch {
    // ignore
  }

  // Notify listeners inside the same tab.
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

export function setAuthUser(user: unknown, persist: boolean) {
  try {
    const raw = JSON.stringify(user ?? null);
    if (persist) {
      localStorage.setItem(AUTH_USER_KEY, raw);
      sessionStorage.removeItem(AUTH_USER_KEY);
    } else {
      sessionStorage.setItem(AUTH_USER_KEY, raw);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

export function clearAuthUser() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function getApiErrorMessage(details: unknown, fallback: string) {
  if (details && typeof details === "object" && "message" in (details as any)) {
    const msg = (details as any).message;
    if (typeof msg === "string" && msg.trim().length > 0) return msg;
  }
  if (typeof details === "string" && details.trim().length > 0) return details;
  return fallback;
}

export async function apiJson<TResponse>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<TResponse> {
  const url = joinUrl(getApiBaseUrl(), path);
  const token = getAuthToken();

  try {
    const res = await axios.request<TResponse>({
      url,
      method: (options.method || "GET") as AxiosRequestConfig["method"],
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...normalizeHeaders(options.headers),
      },
      data: options.body === undefined ? undefined : options.body,
      signal: options.signal as AbortSignal | undefined,
    });

    return res.data as TResponse;
  } catch (e: unknown) {
    const err = e as AxiosError;
    const status = err.response?.status ?? 0;
    const details = err.response?.data ?? null;
    const message = getApiErrorMessage(details, err.message || "Request failed");
    throw new ApiError(status, message, details);
  }
}

export async function apiForm<TResponse>(
  path: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {},
): Promise<TResponse> {
  const url = joinUrl(getApiBaseUrl(), path);
  const token = getAuthToken();

  try {
    const res = await axios.request<TResponse>({
      url,
      method: (options.method || "POST") as AxiosRequestConfig["method"],
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...normalizeHeaders(options.headers),
      },
      data: formData,
      signal: options.signal as AbortSignal | undefined,
    });

    return res.data as TResponse;
  } catch (e: unknown) {
    const err = e as AxiosError;
    const status = err.response?.status ?? 0;
    const details = err.response?.data ?? null;
    const message = getApiErrorMessage(details, err.message || "Request failed");
    throw new ApiError(status, message, details);
  }
}
