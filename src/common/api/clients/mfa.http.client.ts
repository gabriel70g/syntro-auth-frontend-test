import { API_URL, getDefaultHeaders, mergeHeaders } from '@common/lib/config';
import { readJsonSafe } from '@common/api/clients/http.helpers';

function headersWithOptionalBearer(bearer?: string): Record<string, string> {
    const base = getDefaultHeaders();
    if (!bearer) return base;
    return mergeHeaders(base, { Authorization: `Bearer ${bearer}` });
}

export async function postAuthMfaSetup(bearerTempToken: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: headersWithOptionalBearer(bearerTempToken),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAuthMfaEnable(bearerTempToken: string, code: string): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/auth/mfa/enable`, {
        method: 'POST',
        headers: headersWithOptionalBearer(bearerTempToken),
        body: JSON.stringify({ code }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAccountMfaSetup(bearerAccessToken: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/account/mfa/setup`, {
        method: 'POST',
        headers: headersWithOptionalBearer(bearerAccessToken),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAccountMfaConfirmSync(
    bearerAccessToken: string,
    code: string,
    tenantId?: string
): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const base = headersWithOptionalBearer(bearerAccessToken);
    const headers = tenantId ? mergeHeaders(base, { 'X-Tenant-Id': tenantId }) : base;
    const response = await fetch(`${API_URL}/api/account/mfa/confirm-sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAccountMfaDisableRequest(bearerAccessToken: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/account/mfa/disable/request`, {
        method: 'POST',
        headers: headersWithOptionalBearer(bearerAccessToken),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAuthMfaDisableConfirm(token: string): Promise<{ ok: boolean; body: unknown }> {
    const response = await fetch(`${API_URL}/api/auth/mfa/disable/confirm`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ token }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}

export async function postAccountMfaVerify(bearerAccessToken: string, code: string): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const response = await fetch(`${API_URL}/api/account/mfa/verify`, {
        method: 'POST',
        headers: headersWithOptionalBearer(bearerAccessToken),
        body: JSON.stringify({ code }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}
