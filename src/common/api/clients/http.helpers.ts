import { API_URL, API_FETCH_CREDENTIALS, getDefaultHeaders, mergeHeaders } from '@common/lib/config';
import { readStoredAccessToken, writeAccessToken, clearAuthSessionStorage } from '@common/lib/storage/auth-session.storage';
import { extractAccessTokenFromEnvelope } from '@common/api/mappers/auth-session.mapper';

/**
 * Why: Parseo JSON tolerante para capa HTTP.
 */
export async function readJsonSafe(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

/**
 * Why: Interceptor 401 → auto-refresh centralizado.
 * Agrega Bearer desde memoria, y si recibe 401 intenta refresh (cookie HttpOnly)
 * una sola vez antes de redirigir a /login.
 */

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
    try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: API_FETCH_CREDENTIALS,
            headers: getDefaultHeaders(),
            body: JSON.stringify({}),
        });
        if (!res.ok) return null;
        const body = await readJsonSafe(res);
        const newToken = extractAccessTokenFromEnvelope(body);
        if (!newToken) return null;
        writeAccessToken(newToken);
        return newToken;
    } catch {
        return null;
    }
}

function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

export async function authenticatedFetch(
    path: string,
    init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
    const token = readStoredAccessToken();
    const headers = mergeHeaders(
        getDefaultHeaders(),
        {
            ...(init.headers as Record<string, string> | undefined),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    );

    const doFetch = async (authHeaders: Record<string, string>) => {
        const res = await fetch(`${API_URL}${path}`, {
            ...init,
            credentials: API_FETCH_CREDENTIALS,
            headers: authHeaders,
        });
        return { ok: res.ok, status: res.status, body: await readJsonSafe(res) };
    };

    const result = await doFetch(headers);

    if (result.status === 401 && token) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            const retryHeaders = mergeHeaders(headers, { Authorization: `Bearer ${newToken}` });
            return doFetch(retryHeaders);
        }
        clearAuthSessionStorage();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return result;
}
