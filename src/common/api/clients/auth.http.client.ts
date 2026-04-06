import { API_URL, API_FETCH_CREDENTIALS, getDefaultHeaders } from '@common/lib/config';
import { readJsonSafe } from '@common/api/clients/http.helpers';

/**
 * Why: Solo transporte HTTP; el mapeo ocurre fuera (puro).
 */
export async function postAuthLogin(body: { email: string; password: string }): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postOAuthLogin(body: {
    provider: string;
    code: string;
    redirectUri: string;
}): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/oauth/login`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postLogin2fa(body: { tempToken: string; code: string }): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/login/2fa`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

/**
 * Why: Solicitud de recuperación (anti-enumeración: el backend responde 200 genérico).
 */
export async function postAuthForgotPassword(body: { email: string }): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

/**
 * Why: Completa el reset con token del correo; `newPassword` va cifrado con handshake RSA como login.
 */
export async function postAuthResetPassword(body: {
    token: string;
    newPassword: string;
}): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

/** Why: RTR; el refresh va en cookie HttpOnly — body puede ir vacío. */
export async function postAuthRefresh(body: { refreshToken?: string } = {}): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

/** Why: Revoca refresh en servidor y borra la cookie HttpOnly. */
export async function postAuthLogout(body: { refreshToken?: string } = {}): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}
