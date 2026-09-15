import { authenticatedFetch, bffFetch } from '@common/api/clients/http.helpers';

/**
 * Why: Los endpoints /api/auth/mfa/* usan el token temporal del login (no el access token). Lo agrega el BFF
 * desde su cookie HttpOnly.
 */

export async function postAuthMfaSetup(): Promise<{ ok: boolean; body: unknown }> {
    const res = await bffFetch('/api/auth/mfa/setup', { method: 'POST' });
    return { ok: res.ok, body: res.body };
}

export async function postAuthMfaEnable(code: string): Promise<{ ok: boolean; body: unknown }> {
    const res = await bffFetch('/api/auth/mfa/enable', { method: 'POST', body: JSON.stringify({ code }) });
    return { ok: res.ok, body: res.body };
}

/** El token del correo lo agrega el BFF desde su cookie. */
export async function postAuthMfaDisableConfirm(): Promise<{ ok: boolean; body: unknown }> {
    const res = await bffFetch('/api/auth/mfa/disable/confirm', { method: 'POST', body: '{}' });
    return { ok: res.ok, body: res.body };
}

/**
 * Why: Los endpoints /api/account/mfa/* usan la sesión.
 */

export async function postAccountMfaSetup(): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/setup', { method: 'POST' });
}

export async function postAccountMfaConfirmSync(code: string): Promise<{ ok: boolean; body: unknown }> {
    return authenticatedFetch('/api/account/mfa/confirm-sync', {
        method: 'POST',
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
