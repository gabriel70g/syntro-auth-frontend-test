import { API_URL, getDefaultHeaders, mergeHeaders } from '@common/lib/config';
import { readJsonSafe } from '@common/api/clients/http.helpers';

export async function postVerifyEmailConfirm(token: string, tenantId?: string): Promise<{
    ok: boolean;
    body: unknown;
}> {
    const headers = tenantId
        ? mergeHeaders(getDefaultHeaders(), { 'X-Tenant-Id': tenantId })
        : getDefaultHeaders();

    const response = await fetch(`${API_URL}/api/auth/verify-email/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
    });
    return { ok: response.ok, body: await readJsonSafe(response) };
}
