import { API_URL, API_FETCH_CREDENTIALS, getDefaultHeaders, mergeHeaders } from '@common/lib/config';
import { readJsonSafe, authenticatedFetch } from '@common/api/clients/http.helpers';

/**
 * Why: Los endpoints /api/auth/mfa/* usan tempToken (no access token),
 * así que no pasan por authenticatedFetch — el bearer es explícito.
 */

function headersWithBearer(bearer: string): Record<string, string> {
    return mergeHeaders(getDefaultHeaders(), { Authorization: `Bearer ${bearer}` });
}

export async function postAuthMfaSetup(bearerTempToken: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/mfa/setup`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: headersWithBearer(bearerTempToken),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAuthMfaEnable(bearerTempToken: string, code: string): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/mfa/enable`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: headersWithBearer(bearerTempToken),
        body: JSON.stringify({ code }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAuthMfaDisableConfirm(token: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/mfa/disable/confirm`, {
        method: 'POST',
        credentials: API_FETCH_CREDENTIALS,
        headers: getDefaultHeaders(),
        body: JSON.stringify({ token }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

/**
 * Why: Los endpoints /api/account/mfa/* usan access token de sesión →
 * pasan por authenticatedFetch para auto-refresh en 401.
 */

export async function postAccountMfaSetup(): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/setup', { method: 'POST' });
}

export async function postAccountMfaConfirmSync(
    code: string,
    tenantId?: string
): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/confirm-sync', {
        method: 'POST',
        headers: tenantId ? { 'X-Tenant-Id': tenantId } : undefined,
        body: JSON.stringify({ code }),
    });
}

export async function postAccountMfaDisableRequest(): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/disable/request', { method: 'POST' });
}

export async function postAccountMfaVerify(code: string): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}
