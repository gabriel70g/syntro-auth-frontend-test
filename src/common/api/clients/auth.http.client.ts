import { API_URL, getDefaultHeaders } from '@common/lib/config';
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
        headers: getDefaultHeaders(),
        body: JSON.stringify(body),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}
